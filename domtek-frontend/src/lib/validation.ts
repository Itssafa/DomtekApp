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
  return /^\d{8}$/.test(cleaned);
}

/**
 * Filtre de frappe pour un numéro de téléphone : seuls les chiffres sont
 * retenus, 8 au plus. Les lettres, l'indicatif et les espaces sont donc
 * impossibles à saisir, comme pour le CIN. Un numéro incomplet reste
 * saisissable ; son format (exactement 8 chiffres) est vérifié à la sortie
 * du champ et à la soumission.
 */
export function filtreTelephone(valeur: string): string {
  return valeur.replace(/\D/g, "").slice(0, 8);
}

/** Aujourd'hui au format attendu par un `<input type="date">`. */
export const AUJOURD_HUI = new Date().toISOString().slice(0, 10);

/** Champs dont la date ne peut pas être dans le futur. */
const DATES_PASSEES = [
  "date_naissance",
  "cin_delivree_le",
  "date_embauche",
  "date_construction",
];

/** Champs dont la date ne peut pas être dans le passé. */
const DATES_FUTURES = ["date_visite", "date_publication"];

/**
 * Bornes du sélecteur de date pour un champ donné, afin que le calendrier
 * n'offre pas ce que le serveur refusera. Reflète les règles des FormRequest :
 * `before_or_equal:today` d'un côté, `after_or_equal:today` de l'autre.
 *
 * Un champ absent des deux listes n'est pas borné — les dates relatives
 * (fin de période, échéance) dépendent d'un autre champ du formulaire et sont
 * posées au cas par cas.
 */
export function borneDate(champ: string): { min?: string; max?: string } {
  if (DATES_PASSEES.includes(champ)) return { max: AUJOURD_HUI };
  if (DATES_FUTURES.includes(champ)) return { min: AUJOURD_HUI };
  return {};
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
