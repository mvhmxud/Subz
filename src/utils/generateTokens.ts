import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export const generateAccessToken = (
  userId: string,
  username: string,
  name: string,
  image: string,
  onboarding: boolean,
  bio: string
) => {
  return jwt.sign(
    {
      userId: userId,
      username: username,
      name: name || "",
      image: image || "",
      onboarding: onboarding,
      bio: bio,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (userId: string, username: string) => {
  return jwt.sign(
    {
      userId: userId,
      username: username,
    },
    process.env.REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};
