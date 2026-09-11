const TRUST_ORDER = { 高: 4, 中: 3, 低: 2, 未知: 1 };
const RISK_ORDER = { 低: 1, 中: 2, 高: 3, 未知: 4 };
const TRUST_LEVELS = new Set(Object.keys(TRUST_ORDER));
const RISK_LEVELS = new Set(Object.keys(RISK_ORDER));
const RECOMMENDATIONS = new Set(["推荐", "谨慎", "不推荐"]);

function normalizeCandidate(item) {
  const value = item || {};
  const trustLevel = TRUST_LEVELS.has(value.trustLevel) ? value.trustLevel : "未知";
  const riskLevel = RISK_LEVELS.has(value.riskLevel) ? value.riskLevel : "未知";
  const recommendation = RECOMMENDATIONS.has(value.recommendation) ? value.recommendation : "谨慎";
  return {
    name: value.name || "未知",
    description: value.description || "未知",
    matchScore: Number.isFinite(Number(value.matchScore)) ? Math.max(0, Math.min(100, Number(value.matchScore))) : 0,
    trustLevel,
    riskLevel,
    recommendation,
    sourceType: value.sourceType || "未知来源",
    sourceUrl: value.sourceUrl || "未知",
    repositoryUrl: value.repositoryUrl || "未知",
    version: value.version || "未知",
    lastUpdated: value.lastUpdated || "未知",
    permissions: Array.isArray(value.permissions) && value.permissions.length ? value.permissions : ["未知"],
    evidence: Array.isArray(value.evidence) && value.evidence.length ? value.evidence : ["未知"],
    limitations: Array.isArray(value.limitations) && value.limitations.length ? value.limitations : ["未知"],
    installPrompt: value.installPrompt || `请安装 Skill：${value.name || "未知"}。来源：${value.sourceUrl || "未知"}。安装前请核验来源、源码、版本、依赖、权限和安全风险，未经我确认不要执行高风险操作。`
  };
}

function prepareCandidates(candidates) {
  return (Array.isArray(candidates) ? candidates : [])
    .map(normalizeCandidate)
    .sort((a, b) => b.matchScore - a.matchScore || TRUST_ORDER[b.trustLevel] - TRUST_ORDER[a.trustLevel] || RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel])
    .slice(0, 5);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function renderCandidates(candidates, mode = "markdown") {
  const items = prepareCandidates(candidates);
  if (mode === "html") {
    return items.map(item => `<article class="skill-result"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><dl><dt>匹配度</dt><dd>${item.matchScore}</dd><dt>信任度</dt><dd>${escapeHtml(item.trustLevel)}</dd><dt>安全风险</dt><dd>${escapeHtml(item.riskLevel)}</dd><dt>来源</dt><dd><a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.sourceUrl)}</a></dd><dt>关键权限/行为</dt><dd>${item.permissions.map(escapeHtml).join("、")}</dd><dt>证据限制</dt><dd>${item.limitations.map(escapeHtml).join("、")}</dd></dl><button type="button" data-install-prompt="${escapeHtml(item.installPrompt)}">复制给 AI 安装</button></article>`).join("\n");
  }
  const header = "| 候选 Skill | 匹配度 | 信任度 | 安全风险 | 来源 | 关键权限/行为 | 结论 |\n|---|---:|---|---|---|---|---|";
  const rows = items.map(item => `| ${item.name} | ${item.matchScore} | ${item.trustLevel} | ${item.riskLevel} | [来源](${item.sourceUrl}) | ${item.permissions.join("、")} | ${item.recommendation} |`);
  const prompts = items.map(item => `**${item.name}**\n\n<button type="button" data-install-prompt="${escapeHtml(item.installPrompt)}">复制给 AI 安装</button>\n\n\`\`\`text\n${item.installPrompt}\n\`\`\``);
  return [header, ...rows, "", ...prompts].join("\n");
}

if (typeof module !== "undefined") {
  module.exports = { normalizeCandidate, prepareCandidates, renderCandidates };
}
