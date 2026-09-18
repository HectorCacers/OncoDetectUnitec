import useEvaluation from "./hooks/useEvaluation";
import SpinnerOverlay from "./components/SpinnerOverlay";
import GlobalFooter from "./components/GlobalFooter";
import OfflineBanner from "./components/OfflineBanner";
import ScreenWelcome from "./screens/ScreenWelcome";
import ScreenProfile from "./screens/ScreenProfile";
import ScreenLogin from "./screens/ScreenLogin";
import ScreenForm from "./screens/ScreenForm";
import ScreenResults from "./screens/ScreenResults";
import ScreenHistorial from "./screens/ScreenHistorial";
import ScreenFHNC from "./screens/ScreenFHNC";

export default function App() {
  const state = useEvaluation();
  const {
    screen, fhncScreen, historialScreen, doctorToken,
    spinnerVisible, spinnerMode,
    isOnline, pendingCount, offlineMessage, dismissOfflineMessage,
  } = state;

  let content;
  if (fhncScreen) {
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenFHNC state={state} />
        <GlobalFooter red />
      </>
    );
  } else if (historialScreen && doctorToken) {
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenHistorial state={state} />
        <GlobalFooter />
      </>
    );
  } else if (screen === "login") {
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenLogin state={state} />
        <GlobalFooter />
      </>
    );
  } else if (screen === "welcome") {
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenWelcome state={state} />
        <GlobalFooter />
      </>
    );
  } else if (screen === "profile") {
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenProfile state={state} />
        <GlobalFooter />
      </>
    );
  } else if (screen === "results" && state.results) {
    content = (
      <>
        <ScreenResults state={state} />
        <GlobalFooter />
      </>
    );
  } else {
    // default: form
    content = (
      <>
        <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
        <ScreenForm state={state} />
        <GlobalFooter />
      </>
    );
  }

  return (
    <>
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        completedCount={state.completedCount}
        offlineMessage={offlineMessage}
        onDismiss={dismissOfflineMessage}
        onViewCompleted={state.viewMostRecentCompleted}
      />
      {content}
    </>
  );
}
