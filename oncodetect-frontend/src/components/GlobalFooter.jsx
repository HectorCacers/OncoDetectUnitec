export default function GlobalFooter({ red = false }) {
  return (
    <div className={`global-footer${red ? " global-footer-red" : ""}`}>
      <div className="global-footer-left">UNITEC | SPS 2026</div>
      <div className="global-footer-right">
        <span className="gf-web">OncoDetect V5 diseñado por: Luis Velásquez y Fernando Hernández</span>
        <span className="gf-mobile">Diseñado por: Luis V. y Fernando H.</span>
      </div>
    </div>
  );
}
