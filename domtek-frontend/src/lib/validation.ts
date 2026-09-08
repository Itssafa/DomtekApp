export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(password)) {
    return "Le mot de passe doit contenir au moins un caractère spécial.";
  }
  return null;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/\s+/g, "");
  return /^(\+216)?[2-9]\d{7}$/.test(cleaned);
}

export function isPositiveAmount(value: string | number): boolean {
  const n = typeof value === "number" ? value : Number(value);
  return !isNaN(n) && n > 0;
}

export function isValidCin(value: string): boolean {
  return /^\d{8}$/.test(value.trim());
}

export function isValidCinOrPasseport(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

export function isValidCityOrPlace(value: string): boolean {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(value.trim());
}
