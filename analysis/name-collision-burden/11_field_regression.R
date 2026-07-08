# 11 - Field/career-adjusted sensitivity regression.
#
# Does the East-Asian collision excess survive adjusting for research field and career stage,
# not just publication volume? Re-fit the productivity-adjusted model (05) with field (top-scored
# level-0 OpenAlex discipline) and career age (years since first publication) added, and compare
# the East-Asian incidence-rate ratio before and after.
#
# Fit by Poisson GLM: at full enumeration the log-mean coefficients are the population
# conditional-mean ratios regardless of the variance model, and Poisson is numerically stable
# with the 19-level field factor where the negative binomial's joint theta estimation diverges.
# The main analysis (05) shows the Poisson and negative-binomial point estimates coincide.
suppressMessages({ has_dt <- requireNamespace("data.table", quietly = TRUE) })
WORK <- Sys.getenv("OA_WORK", "./build")
OUT <- Sys.getenv("OA_OUT", "./out")
dir.create(OUT, showWarnings = FALSE, recursive = TRUE)
csv <- file.path(WORK, "census_field.csv")

df <- if (has_dt) data.table::fread(csv, data.table = FALSE) else read.csv(csv)
cat(sprintf("rows=%d  field-known=%.1f%%  first_year-known=%.1f%%\n",
            nrow(df), 100 * mean(df$field != "Unknown"), 100 * mean(!is.na(df$first_year))))

df$grp <- relevel(factor(df$grp), ref = "anglophone")
df$lw <- log1p(df$wc)
df$field <- factor(df$field)
df$field <- relevel(df$field, ref = names(sort(table(df$field), decreasing = TRUE))[1])  # most common field as ref
# Reference year for career age: the snapshot year (default = current year). Set
# OA_ANALYSIS_YEAR to the snapshot's year so reruns on newer data stay correct.
analysis_year <- as.integer(Sys.getenv("OA_ANALYSIS_YEAR", format(Sys.Date(), "%Y")))
df$career <- pmax(0, analysis_year - df$first_year)
ext_df <- df[!is.na(df$career), ]

metrics <- c(m_orcid = "ORCID-restricted", m_full = "full-name", m_init = "initial")
out <- list(n = nrow(df), n_ext = nrow(ext_df),
            field_known_pct = round(100 * mean(df$field != "Unknown"), 1),
            ref_field = levels(df$field)[1], analysis_year = analysis_year)
for (m in names(metrics)) {
  base <- glm(as.formula(paste0(m, " ~ grp + lw")), family = poisson("log"), data = df)
  ext  <- glm(as.formula(paste0(m, " ~ grp + lw + field + career")), family = poisson("log"), data = ext_df)
  bc <- exp(coef(base)); ec <- exp(coef(ext))
  out[[m]] <- list(
    label = unname(metrics[m]),
    base = list(east_asian = bc[["grpeast_asian"]], other = bc[["grpother"]], log_works = bc[["lw"]]),
    field_career = list(east_asian = ec[["grpeast_asian"]], other = ec[["grpother"]],
                        log_works = ec[["lw"]], career = ec[["career"]]))
  cat(sprintf("[%-16s] EA IRR  base=%.3f  +field+career=%.3f   (Other %.3f -> %.3f; log-works %.3f -> %.3f)\n",
              m, bc[["grpeast_asian"]], ec[["grpeast_asian"]], bc[["grpother"]], ec[["grpother"]],
              bc[["lw"]], ec[["lw"]]))
}
if (requireNamespace("jsonlite", quietly = TRUE)) {
  writeLines(jsonlite::toJSON(out, auto_unbox = TRUE, pretty = TRUE), file.path(OUT, "field-regression.json"))
  cat("DONE -> field-regression.json\n")
} else {
  saveRDS(out, file.path(OUT, "field-regression.rds"))
  cat("DONE -> field-regression.rds (jsonlite unavailable)\n")
}
