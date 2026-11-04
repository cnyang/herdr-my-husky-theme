const BADGES = ["paw", "sled", "moon", "snowflake"];

export function badgePath(index) {
  return `mods/husky-spaces/art/${BADGES[index % BADGES.length]}.png`;
}
