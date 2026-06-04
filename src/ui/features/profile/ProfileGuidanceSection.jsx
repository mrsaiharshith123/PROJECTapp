import { useNavigate } from "react-router-dom";
import { Card, Button, Body, Caption } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";

/** Settings: replay app guide or review setup wizard. */
export default function ProfileGuidanceSection({ onStartGuide }) {
  const navigate = useNavigate();
  const { settings } = useCommitTrack();

  return (
    <Card className="ct-stack">
      <div>
        <Body className="font-semibold">App guide</Body>
        <Caption className="block mt-1">
          A short walkthrough of Home, Financial pulse, and where to add bills — calm steps you can skip anytime.
        </Caption>
      </div>
      <Button type="button" variant="primary" onClick={onStartGuide}>
        Start app guide
      </Button>

      <div className="border-t border-[var(--ct-border)] pt-4" />

      <div>
        <Body className="font-semibold">Setup wizard</Body>
        <Caption className="block mt-1">
          Review how you use CommitTrack (salaried, household, or business) and update income basics. Your bills stay as
          they are.
        </Caption>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/onboarding?replay=1", { state: { fromProfile: true } })}
      >
        Review setup
      </Button>

      {settings.appGuideComplete && (
        <Caption className="block opacity-80">Last guide was completed on this device. Tap above to see it again.</Caption>
      )}
    </Card>
  );
}
