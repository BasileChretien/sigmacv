import { createServer, type AddressInfo, type Server, type Socket } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Every other mail test replaces nodemailer with a stub (tests/digest-email.test.ts),
// and the E2E job runs without EMAIL_SERVER. A nodemailer upgrade can therefore
// change its exports, the way it reads the connection URL or the headers it
// writes, and leave the whole suite green. This file sends through the REAL
// library to an SMTP sink on the loopback interface: no mock, no network.

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "test-secret-test-secret-123",
  AUTH_URL: "https://cv.example.org",
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  EMAIL_FROM: "SigmaCV <no-reply@sigmacv.test>",
});

import Nodemailer from "next-auth/providers/nodemailer";
import { sendMail } from "@/lib/email/mailer";
import { __resetEnvForTests } from "@/lib/env";

/** What one SMTP connection to the sink carried. */
interface SmtpSession {
  /** The decoded `AUTH PLAIN` payload: NUL, user, NUL, password. */
  auth: string | null;
  mailFrom: string | null;
  rcptTo: string[];
  /** What followed `DATA` on the wire: the message with its dot-stuffing still in. */
  wire: string;
  /** The raw message, headers and body: `wire` with the dot-stuffing undone. */
  data: string;
}

const REJECTED_MAILBOX = "bounce@example.org";

/** The reply to one SMTP command line; records what the line carried. */
function replyTo(line: string, session: SmtpSession): string {
  const verb = line.toUpperCase();
  const mailbox = /<([^>]*)>/.exec(line)?.[1] ?? "";
  if (verb.startsWith("EHLO")) return "250-sink\r\n250 AUTH PLAIN";
  if (verb.startsWith("AUTH PLAIN ")) {
    session.auth = Buffer.from(line.slice("AUTH PLAIN ".length), "base64").toString("utf8");
    return "235 authenticated";
  }
  if (verb.startsWith("MAIL FROM:")) {
    session.mailFrom = mailbox;
    return "250 ok";
  }
  if (verb.startsWith("RCPT TO:")) {
    if (mailbox === REJECTED_MAILBOX) return "550 no such user";
    session.rcptTo.push(mailbox);
    return "250 ok";
  }
  if (verb === "DATA") return "354 go ahead";
  if (verb === "QUIT") return "221 bye";
  return "250 ok";
}

/** Speak just enough SMTP on one connection for nodemailer to deliver a message. */
function serve(socket: Socket, session: SmtpSession): void {
  let buffer = "";
  let inData = false;
  socket.setEncoding("utf8");
  socket.write("220 sink ESMTP\r\n");
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    for (;;) {
      const terminator = inData ? "\r\n.\r\n" : "\r\n";
      const end = buffer.indexOf(terminator);
      if (end === -1) return;
      const piece = buffer.slice(0, end);
      buffer = buffer.slice(end + terminator.length);
      if (inData) {
        session.wire = piece;
        // The client doubles a dot that starts a line; the receiver removes it (RFC 5321, 4.5.2).
        session.data = piece.replace(/(^|\r\n)\./g, "$1");
        inData = false;
        socket.write("250 queued\r\n");
        continue;
      }
      const reply = replyTo(piece, session);
      inData = reply.startsWith("354");
      socket.write(`${reply}\r\n`);
      if (reply.startsWith("221")) socket.end();
    }
  });
  // The client may reset the connection once it has what it needs; without a
  // listener that reset would surface as an uncaught exception in the test run.
  socket.on("error", () => {});
}

/** The header block of a raw message, unfolded, one header per entry. */
function headerLines(raw: string): string[] {
  return raw
    .slice(0, raw.indexOf("\r\n\r\n"))
    .replace(/\r\n[ \t]+/g, " ")
    .split("\r\n");
}

/** The value of the named header among unfolded header lines. */
function headerValue(lines: string[], name: string): string | undefined {
  const prefix = `${name.toLowerCase()}:`;
  return lines
    .find((line) => line.toLowerCase().startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

/**
 * The body part of a multipart message that has the given media type, whatever
 * the order of the parts: the transfer encoding it declares and its body as sent.
 */
function mimePart(raw: string, mediaType: string): { encoding: string | undefined; body: string } {
  const contentType = headerValue(headerLines(raw), "Content-Type") ?? "";
  const boundary = /boundary="?([^";\s]+)/.exec(contentType)?.[1];
  if (!boundary) throw new Error("not a multipart message");
  // What precedes the first delimiter line is the message's own header block;
  // what follows the closing one ("--boundary--") is the end of the message.
  for (const piece of raw.split(`\r\n--${boundary}`).slice(1, -1)) {
    const part = piece.slice("\r\n".length);
    const headers = headerLines(part);
    if (headerValue(headers, "Content-Type")?.split(";")[0] !== mediaType) continue;
    return {
      encoding: headerValue(headers, "Content-Transfer-Encoding"),
      body: part.slice(part.indexOf("\r\n\r\n") + "\r\n\r\n".length),
    };
  }
  throw new Error(`the message has no ${mediaType} part`);
}

/**
 * A quoted-printable body read back: soft line breaks removed, "=XX" turned back
 * into its character. Enough for the ASCII bodies sent here.
 */
function quotedPrintableDecoded(body: string): string {
  return body
    .replace(/=\r\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

const sessions: SmtpSession[] = [];
const sockets = new Set<Socket>();
let sink: Server;
let smtpUrl: string;

function lastSession(): SmtpSession {
  const session = sessions.at(-1);
  if (!session) throw new Error("nothing connected to the SMTP sink");
  return session;
}

beforeAll(async () => {
  sink = createServer((socket) => {
    const session: SmtpSession = { auth: null, mailFrom: null, rcptTo: [], wire: "", data: "" };
    sessions.push(session);
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    serve(socket, session);
  });
  await new Promise<void>((resolve) => sink.listen(0, "127.0.0.1", resolve));
  const { port } = sink.address() as AddressInfo;
  // Percent-encoded "@" and ":" in the credentials, as a provider that uses an
  // address for its user name requires: the URL reader must decode both.
  smtpUrl = `smtp://user%40example.org:p%3Ass@127.0.0.1:${port}`;
  process.env.EMAIL_SERVER = smtpUrl;
  __resetEnvForTests();
});

afterAll(async () => {
  for (const socket of sockets) socket.destroy();
  await new Promise<void>((resolve) => sink.close(() => resolve()));
  delete process.env.EMAIL_SERVER;
  __resetEnvForTests();
});

beforeEach(() => {
  sessions.length = 0;
});

describe("nodemailer, unmocked", () => {
  it("exposes the two export shapes the app imports", async () => {
    const mod = await import("nodemailer");
    expect(typeof mod.default.createTransport).toBe("function"); // src/lib/email/mailer.ts
    // Auth.js: import { createTransport }. Read from the module's own keys: vitest
    // answers a property read on an external module from its default export when
    // the named export is missing, so `typeof mod.createTransport` could not fail.
    expect(Object.keys(mod)).toContain("createTransport");
  });

  it("delivers a digest mail with the one-click unsubscribe headers", async () => {
    const ok = await sendMail({
      to: "reader@example.org",
      subject: "Weekly digest",
      text: "Two new works.",
      unsubscribeUrl: "https://cv.example.org/api/email/unsubscribe?token=t",
    });

    expect(ok).toBe(true);
    const session = lastSession();
    expect(session.auth).toBe("\0user@example.org\0p:ss");
    expect(session.mailFrom).toBe("no-reply@sigmacv.test");
    expect(session.rcptTo).toEqual(["reader@example.org"]);
    const headers = headerLines(session.data);
    expect(headers).toContain("From: SigmaCV <no-reply@sigmacv.test>");
    expect(headers).toContain("To: reader@example.org");
    expect(headers).toContain("Subject: Weekly digest");
    expect(headers).toContain("List-Unsubscribe-Post: List-Unsubscribe=One-Click");
    expect(headers).toContainEqual(
      expect.stringMatching(
        /^List-Unsubscribe: <https:\/\/cv\.example\.org\/api\/email\/unsubscribe\?token=t>/,
      ),
    );
    expect(session.data).toContain("Two new works.");
  });

  it("returns false, without throwing, when the server refuses the recipient", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const ok = await sendMail({ to: REJECTED_MAILBOX, subject: "S", text: "T" });

    expect(ok).toBe(false);
    expect(lastSession().rcptTo).toEqual([]);
    expect(lastSession().data).toBe("");
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it("delivers the Auth.js sign-in link through the provider's own send", async () => {
    const provider = Nodemailer({ id: "email", server: smtpUrl, from: process.env.EMAIL_FROM });
    // The link in the shape Auth.js gives it (@auth/core/lib/actions/signin/send-token.js):
    // the provider's callback path, then callbackUrl, a 64-hex token and the address,
    // in that order. 195 characters: a short stand-in is not sent the way a real link is.
    // The address is chosen for its length: with it the text part is wrapped just
    // before ".org", so one line of the message starts with a dot (asserted below).
    const identifier = "signin-test@example.org";
    const token = "0123456789abcdef".repeat(4);
    const url = `https://cv.example.org/api/auth/callback/email?${new URLSearchParams({
      callbackUrl: "https://cv.example.org/cv",
      token,
      email: identifier,
    })}`;

    await provider.sendVerificationRequest({
      identifier,
      url,
      expires: new Date("2026-10-08T00:00:00.000Z"),
      provider: { ...provider, server: smtpUrl, from: process.env.EMAIL_FROM },
      token,
      theme: {},
      request: new Request("https://cv.example.org/api/auth/signin/email"),
    });

    const session = lastSession();
    expect(session.rcptTo).toEqual([identifier]);
    expect(headerLines(session.data)).toContain("Subject: Sign in to cv.example.org");
    // The HTML part is quoted-printable whatever the link: its markup has lines over
    // 76 characters. A link of this length takes the text part over 76 as well, so
    // nodemailer sends that part quoted-printable too, where a short link leaves it
    // 7bit. In both, "=" is written "=3D" and the link is cut by soft line breaks,
    // one of them inside the token: the link as built above is nowhere in the raw
    // message.
    const text = mimePart(session.data, "text/plain");
    const html = mimePart(session.data, "text/html");
    expect(text.encoding).toBe("quoted-printable");
    expect(html.encoding).toBe("quoted-printable");
    // Read back, it must be whole in both: on a line of its own in the text part,
    // and as the href in the HTML part, where Auth.js writes it as it is ("&"
    // between the parameters, not "&amp;").
    expect(quotedPrintableDecoded(text.body)).toContain(`\r\n${url}\r\n`);
    expect(quotedPrintableDecoded(html.body)).toContain(`href="${url}"`);
    // One break of the text part leaves ".org" at the start of a line, and the
    // client doubles that dot on the wire: the link above is whole only because the
    // sink removes it again ("example..org" otherwise). Should nodemailer come to
    // wrap elsewhere, pick an address that puts a dot there again: without one this
    // test would pass with a sink that undoes nothing.
    expect(
      session.wire,
      "no line of the sign-in mail starts with a dot: it no longer exercises dot-stuffing",
    ).toMatch(/\r\n\.\./);
  });
});
