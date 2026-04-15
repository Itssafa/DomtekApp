'use client';

import { useRef, useEffect, useState } from 'react';

// ─── Scaling wrapper (shared) ─────────────────────────────────────────────────

function ScaledDoc({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [wrapH, setWrapH] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const upd = () => {
      const s = Math.min(1, outer.clientWidth / 794);
      setScale(s);
      setWrapH(inner.scrollHeight * s);
    };
    const o1 = new ResizeObserver(upd);
    const o2 = new ResizeObserver(upd);
    o1.observe(outer);
    o2.observe(inner);
    upd();
    return () => { o1.disconnect(); o2.disconnect(); };
  }, []);

  return (
    <div ref={outerRef}
      className="w-full overflow-hidden print:overflow-visible print:h-auto"
      style={{ height: wrapH }}>
      <div ref={innerRef}
        style={{ width: 794, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratPreviewData {
  // Général
  type: string;
  isLocation: boolean;
  designation: string;
  utilisation: string;
  notes: string;
  // Organisation (Partie A)
  orgNom: string;
  orgAdresse: string;
  orgFormeJuridique: string;
  orgRepresentant: string;
  // Client (Partie B)
  clientNom: string;
  clientCivilite: string;
  clientDateNaissance: string;
  clientCin: string;
  clientTypePiece: string;
  clientCinDelivreeLe: string;
  clientAdresse: string;
  // Bien
  bienDesignation: string;
  bienType: string;
  bienAdresse: string;
  bienSuperficie: string;
  // Dates & durée
  dateContrat: string;
  dateDebut: string;
  dateFin: string;
  duree: string;
  // Finances
  montantHt: string;
  tva: string;
  montantTtc: string;
  periodicite: string;
  jourPaiement: string;
  depotGarantie: string;
  premiereEcheance: string;
  assurance: string;
  // Signature
  villeSignature: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val: string, lang: 'fr' | 'ar'): string {
  if (!val) return lang === 'ar' ? '................' : '................';
  try {
    return new Date(val).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-TN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return val; }
}

function fmtMoney(val: string, lang: 'fr' | 'ar'): string {
  if (!val) return '..........';
  const n = parseFloat(val);
  if (isNaN(n)) return '..........';
  const formatted = n.toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-TN', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });
  return lang === 'ar' ? `${formatted} دينار تونسي` : `${formatted} TND`;
}

function blank(val: string, placeholder = '..................'): string {
  return val || placeholder;
}

const PERIODICITE_FR: Record<string, string> = {
  mensuel: 'mois', bimestriel: 'deux mois', trimestriel: 'trimestre',
  quadrimestriel: 'quatre mois', semestriel: 'semestre', annuel: 'an',
};
const PERIODICITE_AR: Record<string, string> = {
  mensuel: 'شهر', bimestriel: 'شهرين', trimestriel: 'ثلاثة أشهر',
  quadrimestriel: 'أربعة أشهر', semestriel: 'ستة أشهر', annuel: 'سنة',
};

const UTILISATION_FR: Record<string, string> = {
  residence_primaire: 'résidence principale', residence_secondaire: 'résidence secondaire',
  professionnel: 'usage professionnel', commercial: 'usage commercial', autre: 'autre usage',
};
const UTILISATION_AR: Record<string, string> = {
  residence_primaire: 'مسكن رئيسي', residence_secondaire: 'مسكن ثانوي',
  professionnel: 'استخدام مهني', commercial: 'استخدام تجاري', autre: 'استخدام آخر',
};

// ─── Styles communs ───────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  width: 794,           /* A4 at 96 dpi — ScaledDoc handles responsive scaling */
  minHeight: 1123,      /* A4 height at 96 dpi */
  background: '#fff',
  padding: '56px 68px',
  fontFamily: 'Georgia, serif',
  fontSize: '11pt',
  lineHeight: '1.6',
  color: '#111',
  boxSizing: 'border-box',
};

// ─── Template FRANÇAIS ────────────────────────────────────────────────────────

function TemplateFR({ d }: { d: ContratPreviewData }) {
  const isVente = !d.isLocation;
  const titre   = isVente ? 'COMPROMIS DE VENTE' : 'CONTRAT DE BAIL';
  const sous    = isVente
    ? '(Conformément aux dispositions du Code des Obligations et des Contrats tunisien)'
    : '(Conformément à la loi n° 2019-30 du 1er avril 2019 relative aux baux d\'habitation)';

  const periodiciteLabel = PERIODICITE_FR[d.periodicite] ?? d.periodicite;
  const utilisationLabel = UTILISATION_FR[d.utilisation] ?? (d.utilisation || 'habitation');

  return (
    <div style={pageStyle}>
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '24pt', borderBottom: '2px solid #111', paddingBottom: '12pt' }}>
        <div style={{ fontSize: '18pt', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '6pt' }}>{titre}</div>
        <div style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>{sous}</div>
      </div>

      <p style={{ textAlign: 'right', marginBottom: '18pt', fontSize: '10pt' }}>
        {blank(d.villeSignature, 'Tunis')}, le {fmtDate(d.dateContrat || d.dateDebut, 'fr')}
      </p>

      {/* Parties */}
      <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6pt' }}>
        Entre les soussignés :
      </p>

      <div style={{ marginLeft: '12pt', marginBottom: '14pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          {isVente ? 'I. LE VENDEUR :' : 'I. LE BAILLEUR :'}
        </p>
        <p>La société <strong>{blank(d.orgNom)}</strong>, {blank(d.orgFormeJuridique, 'forme juridique non précisée')},</p>
        <p>dont le siège social est à <strong>{blank(d.orgAdresse)}</strong>,</p>
        <p>représentée par <strong>{blank(d.orgRepresentant, 'son représentant légal')}</strong>,</p>
        <p style={{ color: '#444', fontStyle: 'italic' }}>ci-après dénommé{isVente ? ' « Le Vendeur »' : ' « Le Bailleur »'}.</p>
      </div>

      <div style={{ marginLeft: '12pt', marginBottom: '20pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          {isVente ? 'II. L\'ACHETEUR :' : 'II. LE LOCATAIRE :'}
        </p>
        <p><strong>{blank(d.clientCivilite, 'M./Mme')} {blank(d.clientNom, '[Nom du client]')}</strong>,</p>
        <p>né(e) le <strong>{fmtDate(d.clientDateNaissance, 'fr')}</strong>,</p>
        <p>
          titulaire de la {blank(d.clientTypePiece, 'CIN')} N° <strong>{blank(d.clientCin)}</strong>
          {d.clientCinDelivreeLe ? `, délivrée le ${fmtDate(d.clientCinDelivreeLe, 'fr')}` : ''},
        </p>
        <p>demeurant à : <strong>{blank(d.clientAdresse)}</strong>,</p>
        <p style={{ color: '#444', fontStyle: 'italic' }}>ci-après dénommé{isVente ? ' « L\'Acheteur »' : ' « Le Locataire »'}.</p>
      </div>

      <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '16pt 0', fontSize: '10pt' }}>
        Il a été convenu et arrêté ce qui suit :
      </p>
      <hr style={{ borderTop: '1px solid #ccc', marginBottom: '16pt' }} />

      {/* Article 1 — Objet */}
      <div style={{ marginBottom: '14pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          Article 1 — {isVente ? 'Désignation du bien vendu' : 'Objet du bail'}
        </p>
        <p>
          Le {isVente ? 'Vendeur cède et vend à l\'Acheteur' : 'Bailleur donne en location au Locataire'} qui
          {isVente ? ' acquiert et accepte' : ' accepte'}, le bien immobilier désigné comme suit :
        </p>
        <div style={{ margin: '8pt 0', padding: '10pt', background: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '4pt' }}>
          <p><strong>Nature :</strong> {blank(d.bienType)}</p>
          <p><strong>Désignation :</strong> {blank(d.bienDesignation)}</p>
          <p><strong>Situation :</strong> {blank(d.bienAdresse)}</p>
          {d.bienSuperficie && <p><strong>Superficie :</strong> {d.bienSuperficie} m²</p>}
          {d.designation && <p><strong>Libellé :</strong> {d.designation}</p>}
        </div>
        <p>ci-après désigné « Le Bien ».</p>
      </div>

      {/* Article 2 — Durée / Prix */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 2 — Prix de vente</p>
          <p>
            Le présent bien est vendu au prix de <strong>{fmtMoney(d.montantHt, 'fr')}</strong> hors taxe,
            soit <strong>{fmtMoney(d.montantTtc, 'fr')}</strong> toutes taxes comprises (TVA {blank(d.tva, '0')}%).
          </p>
          <p>Le prix est payable selon les modalités convenues entre les parties.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 2 — Durée du bail</p>
          <p>
            Le présent bail est consenti pour une durée de <strong>{blank(d.duree)}</strong>,
            prenant effet le <strong>{fmtDate(d.dateDebut, 'fr')}</strong>
            {d.dateFin ? <>, pour se terminer le <strong>{fmtDate(d.dateFin, 'fr')}</strong></> : ''}.
          </p>
        </div>
      )}

      {/* Article 3 — Loyer / Transfert */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 3 — Transfert de propriété</p>
          <p>
            Le transfert de propriété du Bien est effectif à compter de la date de signature des présentes
            et du paiement intégral du prix de vente, conformément aux dispositions du Code des Obligations
            et des Contrats tunisien.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 3 — Loyer et charges</p>
          <p>
            Le loyer est fixé à <strong>{fmtMoney(d.montantHt, 'fr')}</strong> hors taxe,
            soit <strong>{fmtMoney(d.montantTtc, 'fr')}</strong> TTC (TVA {blank(d.tva, '0')}%).
          </p>
          {d.periodicite && (
            <p>
              Le loyer est payable le <strong>{blank(d.jourPaiement, '1er')}</strong> de
              chaque <strong>{periodiciteLabel}</strong>, à terme échu.
            </p>
          )}
          {d.premiereEcheance && (
            <p>Première échéance : <strong>{fmtDate(d.premiereEcheance, 'fr')}</strong>.</p>
          )}
        </div>
      )}

      {/* Article 4 — Dépôt de garantie / Garanties */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 4 — Garanties du vendeur</p>
          <p>
            Le Vendeur garantit à l'Acheteur la jouissance paisible du Bien, et déclare que le Bien est
            libre de toute inscription, hypothèque, servitude ou charge non déclarée.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 4 — Dépôt de garantie</p>
          {d.depotGarantie ? (
            <p>
              À la signature des présentes, le Locataire verse au Bailleur un dépôt de garantie
              de <strong>{fmtMoney(d.depotGarantie, 'fr')}</strong>, remboursable à l'issue du bail,
              déduction faite des sommes éventuellement dues par le Locataire.
            </p>
          ) : (
            <p>Aucun dépôt de garantie n'est exigé pour le présent contrat.</p>
          )}
        </div>
      )}

      {/* Article 5 — Usage / Déclarations */}
      {!isVente && (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 5 — Usage du bien</p>
          <p>
            Le Locataire s'engage à utiliser le Bien exclusivement à des fins
            de <strong>{utilisationLabel}</strong>, et à l'entretenir en bon état pendant toute la
            durée du bail.
          </p>
        </div>
      )}

      {/* Article 5/6 — Obligations */}
      {!isVente && (
        <>
          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 6 — Obligations du Bailleur</p>
            <p>Le Bailleur est tenu de :</p>
            <ul style={{ margin: '6pt 0 0 18pt' }}>
              <li>Délivrer le Bien en bon état de réparations locatives ;</li>
              <li>Assurer la jouissance paisible du Bien au Locataire ;</li>
              <li>Entretenir le Bien en état de servir à l'usage convenu.</li>
            </ul>
          </div>
          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 7 — Obligations du Locataire</p>
            <p>Le Locataire s'engage à :</p>
            <ul style={{ margin: '6pt 0 0 18pt' }}>
              <li>Payer le loyer aux termes et conditions convenus ;</li>
              <li>User du Bien en bon père de famille ;</li>
              <li>Ne pas sous-louer ni céder le bail sans accord écrit préalable du Bailleur ;</li>
              <li>Permettre l'accès du Bien au Bailleur pour les visites nécessaires avec préavis raisonnable ;</li>
              <li>Restituer le Bien en bon état à l'expiration du bail.</li>
            </ul>
          </div>
          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Article 8 — Résiliation</p>
            <p>
              Le présent contrat peut être résilié par l'une ou l'autre des parties moyennant un préavis
              de trois (3) mois, adressé par lettre recommandée avec accusé de réception.
              En cas de manquement grave, la résiliation peut être prononcée sans préavis.
            </p>
          </div>
        </>
      )}

      {/* Assurance */}
      {d.assurance && (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
            Article {isVente ? '5' : '9'} — Assurance
          </p>
          <p>{d.assurance}</p>
        </div>
      )}

      {/* Notes */}
      {d.notes && (
        <div style={{ marginBottom: '14pt', padding: '8pt', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Clauses particulières</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{d.notes}</p>
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: '32pt', borderTop: '1px solid #ccc', paddingTop: '20pt' }}>
        <p style={{ textAlign: 'center', marginBottom: '24pt', fontSize: '10pt' }}>
          Fait en deux (2) exemplaires originaux à <strong>{blank(d.villeSignature, 'Tunis')}</strong>,
          le <strong>{fmtDate(d.dateContrat || d.dateDebut, 'fr')}</strong>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', minWidth: '42%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
              {isVente ? 'Le Vendeur' : 'Le Bailleur'}
            </p>
            <p style={{ fontSize: '10pt', color: '#555', marginBottom: '48pt' }}>{blank(d.orgNom)}</p>
            <div style={{ borderTop: '1px solid #333', paddingTop: '6pt', fontSize: '10pt' }}>
              Signature et cachet
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '42%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
              {isVente ? "L'Acheteur" : 'Le Locataire'}
            </p>
            <p style={{ fontSize: '10pt', color: '#555', marginBottom: '48pt' }}>{blank(d.clientNom)}</p>
            <div style={{ borderTop: '1px solid #333', paddingTop: '6pt', fontSize: '10pt' }}>
              Lu et approuvé — Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template ARABE ───────────────────────────────────────────────────────────

function TemplateAR({ d }: { d: ContratPreviewData }) {
  const isVente = !d.isLocation;
  const titre   = isVente ? 'عقد بيع' : 'عقد كراء';
  const sous    = isVente
    ? '(طبقاً لأحكام مجلة الالتزامات والعقود التونسية)'
    : '(طبقاً للقانون عدد 30 لسنة 2019 المؤرخ في 1 أفريل 2019 المتعلق بكراء الأماكن السكنية)';

  const periodiciteLabel = PERIODICITE_AR[d.periodicite] ?? d.periodicite;
  const utilisationLabel = UTILISATION_AR[d.utilisation] ?? (d.utilisation || 'سكن');

  const pageStyleAR: React.CSSProperties = {
    ...pageStyle,
    direction: 'rtl',
    fontFamily: '"Traditional Arabic", "Arial Unicode MS", Tahoma, Arial, serif',
    textAlign: 'right',
  };

  return (
    <div style={pageStyleAR}>
      {/* رأس الوثيقة */}
      <div style={{ textAlign: 'center', marginBottom: '24pt', borderBottom: '2px solid #111', paddingBottom: '12pt' }}>
        <div style={{ fontSize: '22pt', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '6pt' }}>{titre}</div>
        <div style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>{sous}</div>
      </div>

      <p style={{ textAlign: 'left', marginBottom: '18pt', fontSize: '10pt' }}>
        {blank(d.villeSignature, 'تونس')}، في {fmtDate(d.dateContrat || d.dateDebut, 'ar')}
      </p>

      {/* الطرفان */}
      <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6pt' }}>
        بين الطرفين المتعاقدين:
      </p>

      <div style={{ marginRight: '12pt', marginBottom: '14pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          {isVente ? 'الطرف الأول (البائع):' : 'الطرف الأول (المؤجر):'}
        </p>
        <p>شركة <strong>{blank(d.orgNom)}</strong>، {blank(d.orgFormeJuridique, 'شكل قانوني غير محدد')}،</p>
        <p>كائن مقرها الاجتماعي بـ <strong>{blank(d.orgAdresse)}</strong>،</p>
        <p>تمثلها <strong>{blank(d.orgRepresentant, 'ممثلها القانوني')}</strong>،</p>
        <p style={{ color: '#444', fontStyle: 'italic' }}>
          ويُشار إليها فيما يلي بـ{isVente ? ' "البائع"' : ' "المؤجر"'}.
        </p>
      </div>

      <div style={{ marginRight: '12pt', marginBottom: '20pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          {isVente ? 'الطرف الثاني (المشتري):' : 'الطرف الثاني (المستأجر):'}
        </p>
        <p><strong>{blank(d.clientNom, '[اسم العميل]')}</strong>،</p>
        <p>مولود(ة) بتاريخ: <strong>{fmtDate(d.clientDateNaissance, 'ar')}</strong>،</p>
        <p>
          حامل(ة) لـ{blank(d.clientTypePiece, 'بطاقة تعريف وطنية')} رقم <strong>{blank(d.clientCin)}</strong>
          {d.clientCinDelivreeLe ? `، صادرة بتاريخ ${fmtDate(d.clientCinDelivreeLe, 'ar')}` : ''}،
        </p>
        <p>يقيم(تقيم) بـ: <strong>{blank(d.clientAdresse)}</strong>،</p>
        <p style={{ color: '#444', fontStyle: 'italic' }}>
          ويُشار إليه/إليها فيما يلي بـ{isVente ? ' "المشتري"' : ' "المستأجر"'}.
        </p>
      </div>

      <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '16pt 0', fontSize: '10pt' }}>
        اتُّفق على ما يلي:
      </p>
      <hr style={{ borderTop: '1px solid #ccc', marginBottom: '16pt' }} />

      {/* الفصل 1 — موضوع العقد */}
      <div style={{ marginBottom: '14pt' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
          الفصل الأول — {isVente ? 'وصف العقار المبيع' : 'موضوع العقد'}
        </p>
        <p>
          {isVente
            ? 'يبيع البائع للمشتري الذي يقبل، العقار الآتي وصفه:'
            : 'يُؤجر المؤجر إلى المستأجر الذي يقبل، العقار الآتي وصفه:'}
        </p>
        <div style={{ margin: '8pt 0', padding: '10pt', background: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '4pt' }}>
          <p><strong>الطبيعة:</strong> {blank(d.bienType)}</p>
          <p><strong>التسمية:</strong> {blank(d.bienDesignation)}</p>
          <p><strong>الكائن بـ:</strong> {blank(d.bienAdresse)}</p>
          {d.bienSuperficie && <p><strong>المساحة:</strong> {d.bienSuperficie} م²</p>}
          {d.designation && <p><strong>البيان:</strong> {d.designation}</p>}
        </div>
        <p>ويُشار إليه فيما يلي بـ "العقار".</p>
      </div>

      {/* الفصل 2 */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الثاني — ثمن البيع</p>
          <p>
            يُحدد ثمن البيع بمبلغ <strong>{fmtMoney(d.montantHt, 'ar')}</strong> باعتبار المعلوم،
            أي ما يعادل <strong>{fmtMoney(d.montantTtc, 'ar')}</strong> شاملاً للأداء على القيمة المضافة
            بنسبة {blank(d.tva, '0')}%.
          </p>
          <p>يُدفع الثمن وفق الشروط المتفق عليها بين الطرفين.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الثاني — مدة العقد</p>
          <p>
            يُبرم هذا العقد لمدة <strong>{blank(d.duree)}</strong>،
            تبدأ من <strong>{fmtDate(d.dateDebut, 'ar')}</strong>
            {d.dateFin ? <> وتنتهي في <strong>{fmtDate(d.dateFin, 'ar')}</strong></> : ''}.
          </p>
        </div>
      )}

      {/* الفصل 3 */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الثالث — نقل الملكية</p>
          <p>
            تنتقل ملكية العقار إلى المشتري فور توقيع هذا العقد وسداد كامل ثمن البيع،
            وذلك طبقاً لأحكام مجلة الالتزامات والعقود التونسية.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الثالث — الكراء والمصاريف</p>
          <p>
            يُحدد الكراء بمبلغ <strong>{fmtMoney(d.montantHt, 'ar')}</strong> باعتبار المعلوم،
            أي ما يعادل <strong>{fmtMoney(d.montantTtc, 'ar')}</strong> شاملاً للأداء
            (أداء على القيمة المضافة بنسبة {blank(d.tva, '0')}%).
          </p>
          {d.periodicite && (
            <p>
              يستوجب دفع الكراء في اليوم <strong>{blank(d.jourPaiement, 'الأول')}</strong> من
              كل <strong>{periodiciteLabel}</strong>.
            </p>
          )}
          {d.premiereEcheance && (
            <p>تاريخ أول قسط: <strong>{fmtDate(d.premiereEcheance, 'ar')}</strong>.</p>
          )}
        </div>
      )}

      {/* الفصل 4 */}
      {isVente ? (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الرابع — ضمانات البائع</p>
          <p>
            يضمن البائع للمشتري الانتفاع الهادئ بالعقار، ويُصرح أن العقار خال من أي
            تسجيل أو رهن أو ارتفاق أو تكليف غير مُصرح به.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الرابع — الكفالة المالية</p>
          {d.depotGarantie ? (
            <p>
              عند توقيع هذا العقد، يدفع المستأجر للمؤجر مبلغ كفالة قدره
              <strong> {fmtMoney(d.depotGarantie, 'ar')}</strong>،
              يُردّ عند انتهاء العقد بعد خصم ما قد يكون مستحقاً على المستأجر.
            </p>
          ) : (
            <p>لا تُشترط أي كفالة مالية في إطار هذا العقد.</p>
          )}
        </div>
      )}

      {/* الفصول الخاصة بالكراء */}
      {!isVente && (
        <>
          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الخامس — استعمال العقار</p>
            <p>
              يلتزم المستأجر باستخدام العقار حصراً لأغراض <strong>{utilisationLabel}</strong>،
              والمحافظة عليه في حالة جيدة طوال مدة العقد.
            </p>
          </div>

          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل السادس — التزامات المؤجر</p>
            <p>يلتزم المؤجر بما يلي:</p>
            <ul style={{ margin: '6pt 0 0 0', paddingRight: '18pt', listStyleType: 'disc' }}>
              <li>تسليم العقار في حالة جيدة صالحة للاستخدام؛</li>
              <li>ضمان الانتفاع الهادئ بالعقار؛</li>
              <li>صيانة العقار لتأدية الغرض المخصص له.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل السابع — التزامات المستأجر</p>
            <p>يلتزم المستأجر بما يلي:</p>
            <ul style={{ margin: '6pt 0 0 0', paddingRight: '18pt', listStyleType: 'disc' }}>
              <li>دفع الكراء في الآجال والشروط المتفق عليها؛</li>
              <li>استخدام العقار بصفة معقولة ومحافظة عليه؛</li>
              <li>عدم الكراء من الباطن دون موافقة خطية مسبقة من المؤجر؛</li>
              <li>السماح للمؤجر بالدخول إلى العقار عند الضرورة مع إشعار مسبق معقول؛</li>
              <li>إرجاع العقار في حالة جيدة عند انتهاء العقد.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '14pt' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>الفصل الثامن — الفسخ</p>
            <p>
              يمكن فسخ هذا العقد من قِبَل أي من الطرفين بموجب إشعار مسبق مدته ثلاثة (3) أشهر،
              يُرسل بموجب رسالة مضمونة الوصول مع الإشعار بالتسلم.
              في حال الإخلال الجسيم بالالتزامات، يمكن الفسخ الفوري دون إشعار.
            </p>
          </div>
        </>
      )}

      {/* التأمين */}
      {d.assurance && (
        <div style={{ marginBottom: '14pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
            الفصل {isVente ? 'الخامس' : 'التاسع'} — التأمين
          </p>
          <p>{d.assurance}</p>
        </div>
      )}

      {/* ملاحظات */}
      {d.notes && (
        <div style={{ marginBottom: '14pt', padding: '8pt', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>بنود خاصة</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{d.notes}</p>
        </div>
      )}

      {/* التوقيعات */}
      <div style={{ marginTop: '32pt', borderTop: '1px solid #ccc', paddingTop: '20pt' }}>
        <p style={{ textAlign: 'center', marginBottom: '24pt', fontSize: '10pt' }}>
          حُرر في نسختين أصليتين بـ <strong>{blank(d.villeSignature, 'تونس')}</strong>،
          في <strong>{fmtDate(d.dateContrat || d.dateDebut, 'ar')}</strong>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', minWidth: '42%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
              {isVente ? 'المشتري' : 'المستأجر'}
            </p>
            <p style={{ fontSize: '10pt', color: '#555', marginBottom: '48pt' }}>{blank(d.clientNom)}</p>
            <div style={{ borderTop: '1px solid #333', paddingTop: '6pt', fontSize: '10pt' }}>
              قُرئ وصودق — الإمضاء
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '42%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4pt' }}>
              {isVente ? 'البائع' : 'المؤجر'}
            </p>
            <p style={{ fontSize: '10pt', color: '#555', marginBottom: '48pt' }}>{blank(d.orgNom)}</p>
            <div style={{ borderTop: '1px solid #333', paddingTop: '6pt', fontSize: '10pt' }}>
              الإمضاء والختم
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Templates exportés pour rendu hors-écran (impression depuis la liste)
export { TemplateFR, TemplateAR };

// ─── Impression isolée (fenêtre dédiée) ───────────────────────────────────────

export function printContrat(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.documentElement.lang = 'fr';
  win.document.head.innerHTML = `
    <meta charset="utf-8">
    <title>Contrat</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:0}body{background:#fff}</style>`;
  win.document.body.innerHTML = el.innerHTML;
  win.focus();
  win.onload = () => { win.print(); win.close(); };
  setTimeout(() => { try { win.print(); win.close(); } catch { /* noop */ } }, 600);
}

// ─── Composant principal exporté ──────────────────────────────────────────────

interface ContratPreviewProps {
  lang: 'fr' | 'ar';
  data: ContratPreviewData;
}

export function ContratPreview({ lang, data }: ContratPreviewProps) {
  return (
    <ScaledDoc>
      {lang === 'ar' ? <TemplateAR d={data} /> : <TemplateFR d={data} />}
    </ScaledDoc>
  );
}
