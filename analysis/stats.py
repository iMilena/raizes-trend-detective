"""
Shared statistics for Raizes do Futuro: Island Trend Detective.
The live tool in index.html implements the same functions in JavaScript.

AI disclosure: written with the help of an AI assistant (Anthropic Claude) and reviewed by the team.
"""
import math

import numpy as np
from scipy import stats


def mann_kendall(x, alpha=0.05):
    """Mann-Kendall test with Hamed & Rao (1998) autocorrelation correction."""
    x = np.asarray(x, dtype=float)
    n = len(x)
    s = 0
    for k in range(n - 1):
        s += np.sign(x[k + 1:] - x[k]).sum()
    # variance with tie correction
    _, counts = np.unique(x, return_counts=True)
    var_s = (n * (n - 1) * (2 * n + 5) - np.sum(counts * (counts - 1) * (2 * counts + 5))) / 18.0

    # Hamed & Rao correction on ranks of the detrended series
    slope, _, _ = sen_slope(x)
    resid = x - slope * np.arange(n)
    r = stats.rankdata(resid)
    r = r - r.mean()
    denom = np.sum(r * r)
    z_crit = stats.norm.ppf(1 - alpha / 2)
    corr = 0.0
    for lag in range(1, n - 1 if denom > 0 else 1):  # constant series: no correction
        rho = np.sum(r[:-lag] * r[lag:]) / denom
        if abs(rho) > z_crit / math.sqrt(n):
            corr += (n - lag) * (n - lag - 1) * (n - lag - 2) * rho
    factor = 1 + 2.0 / (n * (n - 1) * (n - 2)) * corr
    factor = max(factor, 1.0)  # conservative: never shrink the variance
    var_s *= factor

    if s > 0:
        z = (s - 1) / math.sqrt(var_s)
    elif s < 0:
        z = (s + 1) / math.sqrt(var_s)
    else:
        z = 0.0
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    tau = s / (0.5 * n * (n - 1))
    return {"S": int(s), "z": float(z), "p": float(p), "tau": float(tau), "hr_factor": float(factor)}


def sen_slope(x, conf=0.95):
    """Theil-Sen slope per time step with a confidence interval."""
    x = np.asarray(x, dtype=float)
    n = len(x)
    slopes = []
    for i in range(n - 1):
        d = (x[i + 1:] - x[i]) / np.arange(1, n - i)
        slopes.extend(d.tolist())
    slopes = np.sort(np.array(slopes))
    m = len(slopes)
    med = float(np.median(slopes))
    var_s = n * (n - 1) * (2 * n + 5) / 18.0
    c = stats.norm.ppf(1 - (1 - conf) / 2) * math.sqrt(var_s)
    lo = int(round((m - c) / 2.0)) - 1
    hi = int(round((m + c) / 2.0))
    lo, hi = max(lo, 0), min(hi, m - 1)
    return med, float(slopes[lo]), float(slopes[hi])


def bh_fdr(pvals, q=0.05):
    p = np.asarray(pvals)
    order = np.argsort(p)
    m = len(p)
    thresh = q * (np.arange(1, m + 1)) / m
    passed = p[order] <= thresh
    k = np.max(np.where(passed)[0]) + 1 if passed.any() else 0
    out = np.zeros(m, dtype=bool)
    out[order[:k]] = True
    return out.tolist()


