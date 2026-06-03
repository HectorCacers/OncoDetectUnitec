export const getNow = () =>
  new Date().toLocaleString("es-HN", { dateStyle: "long", timeStyle: "short" });

export const calcAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  if (birth > today) return null;
  let years  = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth()    - birth.getMonth();
  let days   = today.getDate()     - birth.getDate();
  if (days < 0)   { months--; }
  if (months < 0) { years--; months += 12; }
  const totalMonths = years * 12 + months;
  if (totalMonths < 0 || years > 18 || (years === 18 && months > 0)) return null;
  return { years, months, totalMonths };
};

export const formatAge = (age) => {
  if (!age) return "";
  if (age.years === 0)  return `${age.months} mes${age.months !== 1 ? "es" : ""}`;
  if (age.months === 0) return `${age.years} año${age.years !== 1 ? "s" : ""}`;
  return `${age.years} año${age.years !== 1 ? "s" : ""} y ${age.months} mes${age.months !== 1 ? "es" : ""}`;
};

export const getDateLimits = () => {
  const today = new Date();
  const max   = today.toISOString().split("T")[0];
  const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return { min: minDate.toISOString().split("T")[0], max };
};
