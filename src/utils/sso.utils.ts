export const initiateMicrosoftSSO = (): void => {
  window.location.href = "/api-dashboard/auth/sso/microsoft";
};

export default {
  initiateMicrosoftSSO,
};
