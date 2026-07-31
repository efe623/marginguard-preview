export function getInstantPulseReply(question: string): string | null {
  const normalized = question.trim().toLowerCase().replace(/[!?.,]+$/g, "").trim();

  if (/^(hi|hello|hey|hiya|yo|good morning|good afternoon|good evening)$/.test(normalized)) {
    return "Hi! What would you like to check—upcoming invoices, projects, costs, or profit?";
  }

  if (/^(thanks|thank you|thx)$/.test(normalized)) {
    return "You’re welcome. Ask me whenever you want to check your business.";
  }

  if (/^(help|what can you do|what do you do|how can you help)$/.test(normalized)) {
    return "I can check upcoming and overdue invoices, create a simple invoice report, summarize projects and costs, and point out possible money leaks.";
  }

  return null;
}
