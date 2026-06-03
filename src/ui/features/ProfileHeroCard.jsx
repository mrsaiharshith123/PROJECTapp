import { Card } from "../primitives/Card.jsx";

export function ProfileHeroCard({ children, className = "" }) {
  return (
    <Card variant="hero" className={`text-center !pb-6 ${className}`.trim()}>
      {children}
    </Card>
  );
}

export default ProfileHeroCard;
