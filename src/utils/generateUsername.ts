// Import helper
export const generateUsername = (name: string) => {
  const prefix = name.slice(0, 3).toLowerCase().replace(/\s/g, "") || "usr";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomDigits}`;
};
  