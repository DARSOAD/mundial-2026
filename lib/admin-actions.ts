const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function callApi(body: any) {
  try {
    const response = await fetch(`${API_URL}/manage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, error };
  }
}

export async function updateParticipantPredictions(userId: string, predictions: any, finals: any) {
  const res = await callApi({
    action: "save",
    userId,
    predictions,
    finals
  });
  return { success: !!res.message };
}

export async function togglePhase(phaseId: string, isActive: boolean) {
  const res = await callApi({
    action: "togglePhase",
    phaseId,
    isActive
  });
  return { success: !!res.activePhases };
}
