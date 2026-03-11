export const initiateMicrosoftSSO = (): void => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "/api-dashboard";
  window.location.href = `${baseURL}/auth/sso/microsoft`;
};

export default {
  initiateMicrosoftSSO,
};
