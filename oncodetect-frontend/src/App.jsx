import useEvaluation from "./hooks/useEvaluation";
import SpinnerOverlay from "./components/SpinnerOverlay";
import GlobalFooter from "./components/GlobalFooter";
import ScreenWelcome from "./screens/ScreenWelcome";
import ScreenProfile from "./screens/ScreenProfile";
import ScreenLogin from "./screens/ScreenLogin";
import ScreenForm from "./screens/ScreenForm";
import ScreenResults from "./screens/ScreenResults";
import ScreenHistorial from "./screens/ScreenHistorial";
import ScreenFHNC from "./screens/ScreenFHNC";

export default function App() {
  const state = useEvaluation();
  const { screen, fhncScreen, historialScreen, doctorToken, spinnerVisible, spinnerMode } = state;

  if (fhncScreen) return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenFHNC state={state} />
      <GlobalFooter red />
    </>
  );

  if (historialScreen && doctorToken) return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenHistorial state={state} />
      <GlobalFooter />
    </>
  );

  if (screen === "login") return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenLogin state={state} />
      <GlobalFooter />
    </>
  );

  if (screen === "welcome") return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenWelcome state={state} />
      <GlobalFooter />
    </>
  );

  if (screen === "profile") return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenProfile state={state} />
      <GlobalFooter />
    </>
  );

  if (screen === "results" && state.results) return (
    <>
      <ScreenResults state={state} />
      <GlobalFooter />
    </>
  );

  // default: form
  return (
    <>
      <SpinnerOverlay visible={spinnerVisible} mode={spinnerMode} />
      <ScreenForm state={state} />
      <GlobalFooter />
    </>
  );
}
