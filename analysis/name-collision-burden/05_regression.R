# 05 - Full-population productivity-adjusted regression of collision counts.
# At full enumeration the coefficients are model-conditional point estimates, so no
# confidence intervals are reported. Fits a negative binomial (for overdispersion) and
# a Poisson for comparison; the load-bearing result is the qualitative one (the
# work-count coefficient is approximately 1.0, i.e. publication volume does not explain
# the between-stratum gap).
suppressMessages({
  has_dt <- requireNamespace("data.table", quietly = TRUE)
  invisible(requireNamespace("MASS", quietly = TRUE))
})
WORK <- Sys.getenv("OA_WORK", "./build")
OUT <- Sys.getenv("OA_OUT", "./out")
dir.create(OUT, showWarnings = FALSE, recursive = TRUE)
csv <- file.path(WORK, "census_for_r.csv")

df <- if (has_dt) data.table::fread(csv, data.table = FALSE) else read.csv(csv)
cat(sprintf("read %d rows\n", nrow(df)))
df$grp <- relevel(factor(df$grp), ref = "anglophone")
df$lw <- log1p(df$wc)

metrics <- c(m_orcid = "ORCID-restricted", m_full = "full-name", m_init = "initial")
out <- list(n = nrow(df), per_group_n = as.list(table(df$grp)))
for (m in names(metrics)) {
  f <- as.formula(paste0(m, " ~ grp + lw"))
  fp <- glm(f, family = poisson(link = "log"), data = df)
  pois <- exp(coef(fp))
  nb_irr <- NULL
  fit_nb <- tryCatch(suppressWarnings(MASS::glm.nb(f, data = df, maxit = 40)),
                     error = function(e) NULL)
  if (!is.null(fit_nb)) {
    nbc <- exp(coef(fit_nb))
    nb_irr <- list(east_asian = nbc[["grpeast_asian"]], other = nbc[["grpother"]],
                   log_works = nbc[["lw"]], theta = fit_nb$theta)
  }
  out[[m]] <- list(
    label = unname(metrics[m]),
    poisson = list(east_asian = pois[["grpeast_asian"]], other = pois[["grpother"]], log_works = pois[["lw"]]),
    negbin = nb_irr)
  cat(sprintf("[%s] poisson IRR_EA=%.3f | negbin IRR_EA=%s\n", m, pois[["grpeast_asian"]],
              if (is.null(nb_irr)) "NA" else sprintf("%.3f", nb_irr$east_asian)))
}
if (requireNamespace("jsonlite", quietly = TRUE)) {
  writeLines(jsonlite::toJSON(out, auto_unbox = TRUE, pretty = TRUE), file.path(OUT, "regression-irr.json"))
  cat("DONE -> regression-irr.json\n")
} else {
  saveRDS(out, file.path(OUT, "regression-irr.rds"))
  cat("DONE -> regression-irr.rds (jsonlite unavailable)\n")
}
