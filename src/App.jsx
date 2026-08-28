import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Package, CalendarDays, FileText, Plus, Search,
  Edit2, Trash2, X, AlertTriangle, CheckCircle2, Clock, RotateCcw,
  Save, ChevronRight, Gauge, Droplet, MapPin, Building2, Loader2,
  AlertCircle, ShieldCheck, ClipboardList, ChevronDown, Info,
  Paperclip, Eye, Download, FileUp
} from 'lucide-react';

/* ============================================================
   CONSTANTES METIER (arrêté du 20/11/2017 - valeurs indicatives)
   ============================================================ */
const CATEGORIES = {
  A: { label: 'A', name: 'Catégorie A', color: '#DC2626', defaultInspection: 1, defaultRequal: 10 },
  B: { label: 'B', name: 'Catégorie B', color: '#EA580C', defaultInspection: 1, defaultRequal: 10 },
  C: { label: 'C', name: 'Catégorie C', color: '#CA8A04', defaultInspection: 1, defaultRequal: 40 },
  EXEMPTE: { label: 'Exempté', name: 'Exempté', color: '#64748B', defaultInspection: 0, defaultRequal: 0 },
};

const TYPES_EQUIPEMENT = [
  'Récipient sous pression', 'Générateur de vapeur', 'Tuyauterie', 'Réservoir cryogénique',
  'Compresseur / réservoir d\'air', 'Échangeur thermique', 'Autoclave', 'Autre'
];

const STATUTS_VALIDATION = {
  a_faire: { label: 'À faire', color: '#64748B', bg: '#F1F5F9' },
  en_cours: { label: 'En cours', color: '#CA8A04', bg: '#FEF9C3' },
  realise: { label: 'Réalisé', color: '#0F766E', bg: '#CCFBF1' },
  valide: { label: 'Validé par organisme agréé', color: '#15803D', bg: '#DCFCE7' },
};

const TYPES_DOCUMENT = ['Rapport d\'inspection', 'Procès-verbal de requalification', 'Certificat d\'épreuve', 'Plan d\'inspection', 'Note de calcul', 'Autre'];

// Taille max acceptée pour un fichier joint (les données sont stockées
// encodées en base64 dans la fiche équipement — voir stockage plus bas —
// d'où une marge de sécurité par rapport à la limite de 5 Mo par clé de
// window.storage).
const FICHIER_MAX_BYTES = 4 * 1024 * 1024; // 4 Mo

// Types de fichiers acceptés lors d'un "ajout document" ou d'une pièce
// jointe à un contrôle. L'aperçu en pop-up n'est disponible nativement
// (navigateur) que pour le PDF et les images ; les autres types restent
// téléchargeables / ouvrables mais sans aperçu intégré.
const ACCEPT_FICHIER = 'application/pdf,.pdf,image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt';
const EXTENSIONS_APERCU = ['pdf']; // rendu en <iframe>
const EXTENSIONS_IMAGE = ['png', 'jpg', 'jpeg', 'webp', 'gif']; // rendu en <img>

const STORAGE_PREFIX = 'equipement:';
const META_INIT_KEY = 'meta:initialized';

/* ============================================================
   DONNEES D'EXEMPLE (pré-remplissage premier lancement)
   ============================================================ */
function buildSeedData() {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const yearsAgo = (n, m = 0) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); d.setMonth(d.getMonth() - m); return iso(d); };

  const base = [
    {
      nom: 'Ballon d\'air comprimé BA-01', numeroIdentification: 'ESP-2014-0451', categorie: 'B',
      type: 'Compresseur / réservoir d\'air', fluide: 'Air comprimé', ps: 11, volume: 500,
      dateMiseEnService: '2014-03-12', atelier: 'Atelier Compression', organismeHabilite: 'APAVE',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 10,
      statutValidation: 'valide', valideur: { nom: 'J. Marchand (APAVE)', date: daysAgo(40) },
      historique: [
        { date: daysAgo(40), type: 'inspection', organisme: 'APAVE', resultat: 'Conforme' },
        { date: yearsAgo(3), type: 'requalification', organisme: 'APAVE', resultat: 'Conforme - épreuve hydraulique 16.5 bar' },
      ],
      documents: [
        { nom: 'PV_requalification_BA01_2021.pdf', type: 'Procès-verbal de requalification', date: yearsAgo(3) },
        { nom: 'Rapport_inspection_BA01.pdf', type: 'Rapport d\'inspection', date: daysAgo(40) },
      ],
    },
    {
      nom: 'Chaudière vapeur CV-2', numeroIdentification: 'ESP-2009-0117', categorie: 'A',
      type: 'Générateur de vapeur', fluide: 'Vapeur d\'eau', ps: 18, volume: 2200,
      dateMiseEnService: '2009-06-01', atelier: 'Chaufferie centrale', organismeHabilite: 'BUREAU VERITAS',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 10,
      statutValidation: 'realise', valideur: { nom: '', date: '' },
      historique: [
        { date: daysAgo(20), type: 'inspection', organisme: 'BUREAU VERITAS', resultat: 'Conforme avec réserve mineure' },
        { date: yearsAgo(4), type: 'requalification', organisme: 'BUREAU VERITAS', resultat: 'Conforme' },
      ],
      documents: [
        { nom: 'Rapport_inspection_CV2_2026.pdf', type: 'Rapport d\'inspection', date: daysAgo(20) },
      ],
    },
    {
      nom: 'Cuve stockage azote liquide N2-1', numeroIdentification: 'ESP-2018-0892', categorie: 'C',
      type: 'Réservoir cryogénique', fluide: 'Azote liquide', ps: 5, volume: 3000,
      dateMiseEnService: '2018-09-15', atelier: 'Zone gaz industriels', organismeHabilite: 'DEKRA',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 40,
      statutValidation: 'a_faire', valideur: { nom: '', date: '' },
      historique: [
        { date: yearsAgo(1, 1), type: 'inspection', organisme: 'DEKRA', resultat: 'Conforme' },
      ],
      documents: [],
    },
    {
      nom: 'Autoclave stérilisation AC-3', numeroIdentification: 'ESP-2020-0233', categorie: 'B',
      type: 'Autoclave', fluide: 'Vapeur saturée', ps: 4, volume: 180,
      dateMiseEnService: '2020-01-20', atelier: 'Laboratoire process', organismeHabilite: 'APAVE',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 10,
      statutValidation: 'en_cours', valideur: { nom: '', date: '' },
      historique: [
        { date: daysAgo(75), type: 'inspection', organisme: 'APAVE', resultat: 'Conforme' },
      ],
      documents: [
        { nom: 'Rapport_inspection_AC3.pdf', type: 'Rapport d\'inspection', date: daysAgo(75) },
      ],
    },
    {
      nom: 'Tuyauterie vapeur HP TVH-6', numeroIdentification: 'ESP-2012-0064', categorie: 'A',
      type: 'Tuyauterie', fluide: 'Vapeur surchauffée', ps: 24, volume: 90,
      dateMiseEnService: '2012-11-05', atelier: 'Chaufferie centrale', organismeHabilite: 'BUREAU VERITAS',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 10,
      statutValidation: 'valide', valideur: { nom: 'S. Le Gall (Bureau Veritas)', date: daysAgo(340) },
      historique: [
        { date: daysAgo(340), type: 'inspection', organisme: 'BUREAU VERITAS', resultat: 'Conforme' },
      ],
      documents: [],
    },
    {
      nom: 'Échangeur process EX-9', numeroIdentification: 'ESP-2016-0509', categorie: 'C',
      type: 'Échangeur thermique', fluide: 'Eau glycolée', ps: 8, volume: 650,
      dateMiseEnService: '2016-04-18', atelier: 'Atelier production 2', organismeHabilite: 'APAVE',
      inspectionPeriodiciteAns: 1, requalificationPeriodiciteAns: 40,
      statutValidation: 'a_faire', valideur: { nom: '', date: '' },
      historique: [
        { date: yearsAgo(2), type: 'inspection', organisme: 'APAVE', resultat: 'Conforme' },
      ],
      documents: [],
    },
    {
      nom: 'Réservoir tampon eau surchauffée RT-4', numeroIdentification: 'ESP-2007-0033', categorie: 'exempte'.toUpperCase() === 'EXEMPTE' ? 'EXEMPTE' : 'EXEMPTE',
      type: 'Récipient sous pression', fluide: 'Eau surchauffée', ps: 2.5, volume: 120,
      dateMiseEnService: '2007-02-10', atelier: 'Sous-station technique', organismeHabilite: '—',
      inspectionPeriodiciteAns: 0, requalificationPeriodiciteAns: 0,
      statutValidation: 'valide', valideur: { nom: 'Auto-contrôle interne', date: yearsAgo(1) },
      historique: [
        { date: yearsAgo(1), type: 'inspection', organisme: 'Interne', resultat: 'Contrôle visuel OK' },
      ],
      documents: [],
    },
  ];

  return base.map((e, idx) => ({
    id: `seed-${idx + 1}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...e,
  }));
}

/* ============================================================
   HELPERS DATE / ECHEANCES
   ============================================================ */
function parseISO(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}
function addYearsToDate(dateStr, years) {
  const d = parseISO(dateStr);
  if (!d || !years) return null;
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + years);
  return r;
}
function toISO(d) { return d ? d.toISOString().slice(0, 10) : null; }
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseISO(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function daysUntil(dateStr) {
  const d = parseISO(dateStr);
  if (!d) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function lastEntryOfType(historique, type) {
  const entries = (historique || []).filter(h => h.type === type && h.date).sort((a, b) => b.date.localeCompare(a.date));
  return entries[0] || null;
}

function computeEcheances(eq) {
  const lastInspection = lastEntryOfType(eq.historique, 'inspection');
  const lastRequal = lastEntryOfType(eq.historique, 'requalification');
  const baseInspDate = lastInspection ? lastInspection.date : eq.dateMiseEnService;
  const baseRequalDate = lastRequal ? lastRequal.date : eq.dateMiseEnService;

  const nextInspection = eq.inspectionPeriodiciteAns ? toISO(addYearsToDate(baseInspDate, eq.inspectionPeriodiciteAns)) : null;
  const nextRequalification = eq.requalificationPeriodiciteAns ? toISO(addYearsToDate(baseRequalDate, eq.requalificationPeriodiciteAns)) : null;

  let nextEcheance = null, nextEcheanceType = null;
  if (nextInspection && nextRequalification) {
    if (nextInspection <= nextRequalification) { nextEcheance = nextInspection; nextEcheanceType = 'inspection'; }
    else { nextEcheance = nextRequalification; nextEcheanceType = 'requalification'; }
  } else if (nextInspection) { nextEcheance = nextInspection; nextEcheanceType = 'inspection'; }
  else if (nextRequalification) { nextEcheance = nextRequalification; nextEcheanceType = 'requalification'; }

  return { nextInspection, nextRequalification, nextEcheance, nextEcheanceType };
}

function getAlertLevel(days) {
  if (days === null) return { level: 'none', label: 'Sans échéance', text: '#64748B', bg: '#F1F5F9', ring: '#CBD5E1' };
  if (days < 0) return { level: 'overdue', label: `Dépassée de ${Math.abs(days)} j`, text: '#FFFFFF', bg: '#7F1D1D', ring: '#7F1D1D' };
  if (days < 30) return { level: 'urgent', label: `${days} j restants`, text: '#FFFFFF', bg: '#DC2626', ring: '#DC2626' };
  if (days <= 90) return { level: 'warning', label: `${days} j restants`, text: '#7C2D12', bg: '#FED7AA', ring: '#EA580C' };
  return { level: 'ok', label: `${days} j restants`, text: '#14532D', bg: '#DCFCE7', ring: '#16A34A' };
}

function fmtTaille(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function extensionOf(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(filename || '');
  return m ? m[1].toLowerCase() : '';
}

// Lit un fichier (PDF, image, Word, Excel…) choisi par l'utilisateur et le
// convertit en data URL base64, seul format que window.storage / localStorage
// savent persister (texte uniquement — voir la section STOCKAGE plus bas).
// Retourne { dataUrl, extension, taille, nomOriginal }.
function readFichierAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const ext = extensionOf(file.name);
    if (file.size > FICHIER_MAX_BYTES) {
      reject(new Error(`Le fichier dépasse la taille maximale autorisée (${fmtTaille(FICHIER_MAX_BYTES)}).`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, extension: ext, taille: file.size, nomOriginal: file.name });
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsDataURL(file);
  });
}

function conformiteStatut(eq) {
  const { nextEcheance } = computeEcheances(eq);
  if (!nextEcheance) return 'conforme';
  const d = daysUntil(nextEcheance);
  if (d < 0) return 'non_conforme';
  if (d <= 90) return 'alerte';
  return 'conforme';
}

/* ============================================================
   STOCKAGE
   ------------------------------------------------------------
   Dans l'environnement Claude.ai, window.storage (API de
   persistance des artifacts) est disponible nativement.
   Hors de Claude.ai (déploiement autonome / GitHub Pages), cette
   API n'existe pas : on bascule automatiquement sur un adaptateur
   localStorage qui expose la même interface asynchrone
   (get/set/delete/list), afin que le reste du code n'ait aucune
   modification à connaître. Voir le README pour les alternatives
   (IndexedDB, backend externe) si le volume de données grandit.
   ============================================================ */
const LOCAL_STORAGE_NAMESPACE = 'suivi-esp:';

function createLocalStorageAdapter() {
  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_NAMESPACE + key);
        return raw === null ? null : { key, value: raw, shared: false };
      } catch (e) { return null; }
    },
    async set(key, value) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_NAMESPACE + key, value);
        return { key, value, shared: false };
      } catch (e) { return null; }
    },
    async delete(key) {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_NAMESPACE + key);
        return { key, deleted: true, shared: false };
      } catch (e) { return null; }
    },
    async list(prefix) {
      try {
        const keys = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(LOCAL_STORAGE_NAMESPACE)) {
            const bare = k.slice(LOCAL_STORAGE_NAMESPACE.length);
            if (!prefix || bare.startsWith(prefix)) keys.push(bare);
          }
        }
        return { keys, prefix, shared: false };
      } catch (e) { return null; }
    },
  };
}

// Détection : utilise window.storage (Claude.ai) si présent, sinon localStorage.
const storageBackend = (typeof window !== 'undefined' && window.storage)
  ? {
      get: (k) => window.storage.get(k, false),
      set: (k, v) => window.storage.set(k, v, false),
      delete: (k) => window.storage.delete(k, false),
      list: (p) => window.storage.list(p, false),
    }
  : createLocalStorageAdapter();

async function storageListEquipments() {
  const res = await storageBackend.list(STORAGE_PREFIX);
  return (res && res.keys) ? res.keys : [];
}
async function storageLoadAll() {
  const keys = await storageListEquipments();
  const out = [];
  for (const k of keys) {
    try {
      const res = await storageBackend.get(k);
      if (res && res.value) out.push(JSON.parse(res.value));
    } catch (e) { /* clé illisible, on ignore */ }
  }
  return out;
}
async function storageSave(eq) {
  return storageBackend.set(STORAGE_PREFIX + eq.id, JSON.stringify(eq));
}
async function storageDelete(id) {
  return storageBackend.delete(STORAGE_PREFIX + id);
}
async function storageIsInitialized() {
  try {
    const res = await storageBackend.get(META_INIT_KEY);
    return !!(res && res.value);
  } catch (e) { return false; }
}
async function storageSetInitialized() {
  return storageBackend.set(META_INIT_KEY, '1');
}

/* ============================================================
   PETITS COMPOSANTS UI
   ============================================================ */
function Plaque({ children, className = '' }) {
  return (
    <div className={`relative bg-white border border-slate-300 rounded-md shadow-sm ${className}`}>
      <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-300" />
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-300" />
      <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-300" />
      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-300" />
      {children}
    </div>
  );
}

function AlertPill({ days }) {
  const a = getAlertLevel(days);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: a.bg, color: a.text }}
    >
      {a.level === 'overdue' && <AlertTriangle size={12} />}
      {a.level === 'urgent' && <AlertTriangle size={12} />}
      {a.level === 'warning' && <Clock size={12} />}
      {a.level === 'ok' && <CheckCircle2 size={12} />}
      {a.label}
    </span>
  );
}

function CategoryBadge({ cat }) {
  const c = CATEGORIES[cat] || CATEGORIES.EXEMPTE;
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: c.color }}
      title={c.name}
    >
      {c.label === 'Exempté' ? 'E' : c.label}
    </span>
  );
}

function StatutValidationBadge({ statut }) {
  const s = STATUTS_VALIDATION[statut] || STATUTS_VALIDATION.a_faire;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ============================================================
   FORMULAIRE EQUIPEMENT (ajout / edition)
   ============================================================ */
function EquipmentForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(() => initial || {
    nom: '', numeroIdentification: '', categorie: 'B', type: TYPES_EQUIPEMENT[0],
    fluide: '', ps: '', volume: '', dateMiseEnService: '', atelier: '', organismeHabilite: '',
    inspectionPeriodiciteAns: CATEGORIES.B.defaultInspection, requalificationPeriodiciteAns: CATEGORIES.B.defaultRequal,
    statutValidation: 'a_faire', valideur: { nom: '', date: '' },
    historique: [], documents: [],
  });

  function updateField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }
  function onCategorieChange(cat) {
    setForm(f => ({
      ...f, categorie: cat,
      inspectionPeriodiciteAns: CATEGORIES[cat].defaultInspection,
      requalificationPeriodiciteAns: CATEGORIES[cat].defaultRequal,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim() || !form.numeroIdentification.trim()) return;
    onSave({
      ...form,
      ps: form.ps === '' ? '' : Number(form.ps),
      volume: form.volume === '' ? '' : Number(form.volume),
      inspectionPeriodiciteAns: Number(form.inspectionPeriodiciteAns) || 0,
      requalificationPeriodiciteAns: Number(form.requalificationPeriodiciteAns) || 0,
    });
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Package size={18} className="text-orange-600" />
            {initial ? 'Modifier l\'équipement' : 'Nouvel équipement'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Nom / repère *</label>
              <input required className={inputCls} value={form.nom} onChange={e => updateField('nom', e.target.value)} placeholder="ex : Ballon d'air comprimé BA-01" />
            </div>
            <div>
              <label className={labelCls}>Numéro d'identification *</label>
              <input required className={inputCls + ' font-mono'} value={form.numeroIdentification} onChange={e => updateField('numeroIdentification', e.target.value)} placeholder="ESP-2024-0001" />
            </div>
            <div>
              <label className={labelCls}>Catégorie de risque</label>
              <select className={inputCls} value={form.categorie} onChange={e => onCategorieChange(e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type d'équipement</label>
              <select className={inputCls} value={form.type} onChange={e => updateField('type', e.target.value)}>
                {TYPES_EQUIPEMENT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fluide</label>
              <input className={inputCls} value={form.fluide} onChange={e => updateField('fluide', e.target.value)} placeholder="ex : Air comprimé" />
            </div>
            <div>
              <label className={labelCls}>PS - Pression de service (bar)</label>
              <input type="number" step="0.1" className={inputCls + ' font-mono'} value={form.ps} onChange={e => updateField('ps', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Volume V (L)</label>
              <input type="number" step="1" className={inputCls + ' font-mono'} value={form.volume} onChange={e => updateField('volume', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Date de mise en service</label>
              <input type="date" className={inputCls} value={form.dateMiseEnService} onChange={e => updateField('dateMiseEnService', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Atelier / localisation</label>
              <input className={inputCls} value={form.atelier} onChange={e => updateField('atelier', e.target.value)} placeholder="ex : Atelier Compression" />
            </div>
            <div>
              <label className={labelCls}>Organisme habilité</label>
              <input className={inputCls} value={form.organismeHabilite} onChange={e => updateField('organismeHabilite', e.target.value)} placeholder="ex : APAVE, BUREAU VERITAS, DEKRA…" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Info size={13} /> Périodicités réglementaires (modifiables selon plan d'inspection)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Inspection périodique (années)</label>
                <input type="number" min="0" className={inputCls} value={form.inspectionPeriodiciteAns} onChange={e => updateField('inspectionPeriodiciteAns', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Requalification périodique (années)</label>
                <input type="number" min="0" className={inputCls} value={form.requalificationPeriodiciteAns} onChange={e => updateField('requalificationPeriodiciteAns', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Statut de validation</label>
            <select className={inputCls} value={form.statutValidation} onChange={e => updateField('statutValidation', e.target.value)}>
              {Object.entries(STATUTS_VALIDATION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom du valideur</label>
              <input className={inputCls} value={form.valideur?.nom || ''} onChange={e => updateField('valideur', { ...form.valideur, nom: e.target.value })} placeholder="ex : J. Marchand (APAVE)" />
            </div>
            <div>
              <label className={labelCls}>Date de validation</label>
              <input type="date" className={inputCls} value={form.valideur?.date || ''} onChange={e => updateField('valideur', { ...form.valideur, date: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md flex items-center gap-1.5">
              <Save size={15} /> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   POP-UP DE VISUALISATION D'UN DOCUMENT (PDF, image, ou autre)
   ============================================================ */
function DocumentViewerModal({ doc, onClose }) {
  if (!doc || !doc.fichier) return null;
  const ext = doc.fichierExtension || extensionOf(doc.fichierNomOriginal) || '';
  const isPdf = EXTENSIONS_APERCU.includes(ext);
  const isImage = EXTENSIONS_IMAGE.includes(ext);
  const nomTelechargement = doc.fichierNomOriginal || `${doc.nom || 'document'}${ext ? '.' + ext : ''}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{doc.nom}</p>
              <p className="text-xs text-slate-400">
                {doc.type}{doc.date ? ` · ${fmtDate(doc.date)}` : ''}{doc.fichierTaille ? ` · ${fmtTaille(doc.fichierTaille)}` : ''}{ext ? ` · .${ext}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={doc.fichier} download={nomTelechargement}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-md" title="Télécharger"
            ><Download size={16} /></a>
            <a
              href={doc.fichier} target="_blank" rel="noreferrer"
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-md" title="Ouvrir dans un nouvel onglet"
            ><Eye size={16} /></a>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-md" title="Fermer"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 min-h-0 flex items-center justify-center overflow-auto">
          {isPdf ? (
            <iframe title={doc.nom} src={doc.fichier} className="w-full h-full border-0" />
          ) : isImage ? (
            <img src={doc.fichier} alt={doc.nom} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-slate-400 p-8">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aperçu non disponible pour ce type de fichier{ext ? ` (.${ext})` : ''}.</p>
              <p className="text-xs mt-1">Utilisez « Télécharger » ou « Ouvrir dans un nouvel onglet » ci-dessus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PANNEAU DETAIL EQUIPEMENT (historique + documents + contrôle)
   ============================================================ */
const CONTROLE_VIDE = { date: '', type: 'inspection', organisme: '', resultat: '', fichier: null, fichierTaille: null, fichierExtension: null, fichierNomOriginal: null };
const DOC_VIDE = { nom: '', type: TYPES_DOCUMENT[0], date: '', fichier: null, fichierTaille: null, fichierExtension: null, fichierNomOriginal: null };

function EquipmentDetail({ eq, onClose, onEdit, onDelete, onAddControle, onAddDocument, onViewDocument }) {
  const { nextInspection, nextRequalification, nextEcheance } = computeEcheances(eq);
  const [showAddControle, setShowAddControle] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [controle, setControle] = useState({ ...CONTROLE_VIDE, organisme: eq.organismeHabilite || '' });
  const [doc, setDoc] = useState(DOC_VIDE);
  const [docError, setDocError] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [controleError, setControleError] = useState('');
  const [controleLoading, setControleLoading] = useState(false);

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40";

  async function handleDocFichierChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de resélectionner le même fichier après une erreur
    if (!file) return;
    setDocError('');
    setDocLoading(true);
    try {
      const { dataUrl, extension, taille, nomOriginal } = await readFichierAsDataURL(file);
      setDoc(d => ({ ...d, fichier: dataUrl, fichierTaille: taille, fichierExtension: extension, fichierNomOriginal: nomOriginal, nom: d.nom || nomOriginal.replace(/\.[^.]+$/, '') }));
    } catch (err) {
      setDocError(err.message || 'Impossible de lire ce fichier.');
    } finally {
      setDocLoading(false);
    }
  }

  async function handleControleFichierChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setControleError('');
    setControleLoading(true);
    try {
      const { dataUrl, extension, taille, nomOriginal } = await readFichierAsDataURL(file);
      setControle(c => ({ ...c, fichier: dataUrl, fichierTaille: taille, fichierExtension: extension, fichierNomOriginal: nomOriginal }));
    } catch (err) {
      setControleError(err.message || 'Impossible de lire ce fichier.');
    } finally {
      setControleLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <CategoryBadge cat={eq.categorie} />
            <div>
              <h2 className="text-base font-bold text-slate-800">{eq.nom}</h2>
              <p className="text-xs text-slate-500 font-mono">{eq.numeroIdentification}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(eq)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md" title="Modifier"><Edit2 size={16} /></button>
            <button onClick={() => onDelete(eq)} className="p-2 text-red-500 hover:bg-red-50 rounded-md" title="Supprimer"><Trash2 size={16} /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-md" title="Fermer"><X size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Plaque className="p-3"><p className="text-xs text-slate-500 flex items-center gap-1"><Gauge size={12} />PS</p><p className="font-mono font-semibold text-slate-800">{eq.ps || '—'} bar</p></Plaque>
            <Plaque className="p-3"><p className="text-xs text-slate-500 flex items-center gap-1"><Droplet size={12} />Volume</p><p className="font-mono font-semibold text-slate-800">{eq.volume || '—'} L</p></Plaque>
            <Plaque className="p-3"><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} />Atelier</p><p className="font-semibold text-slate-800 truncate">{eq.atelier || '—'}</p></Plaque>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Type : </span><span className="font-medium text-slate-800">{eq.type}</span></div>
            <div><span className="text-slate-500">Fluide : </span><span className="font-medium text-slate-800">{eq.fluide || '—'}</span></div>
            <div><span className="text-slate-500">Mise en service : </span><span className="font-medium text-slate-800">{fmtDate(eq.dateMiseEnService)}</span></div>
            <div className="flex items-center gap-1.5"><Building2 size={13} className="text-slate-400" /><span className="font-medium text-slate-800">{eq.organismeHabilite || '—'}</span></div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md p-3">
            <div>
              <p className="text-xs text-slate-500">Statut de validation</p>
              <div className="mt-1"><StatutValidationBadge statut={eq.statutValidation} /></div>
              {eq.valideur?.nom && <p className="text-xs text-slate-500 mt-1">{eq.valideur.nom} — {fmtDate(eq.valideur.date)}</p>}
            </div>
            {nextEcheance && <AlertPill days={daysUntil(nextEcheance)} />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-md p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prochaine inspection</p>
              <p className="font-mono font-semibold text-slate-800 mt-1">{nextInspection ? fmtDate(nextInspection) : 'N/A'}</p>
            </div>
            <div className="border border-slate-200 rounded-md p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prochaine requalification</p>
              <p className="font-mono font-semibold text-slate-800 mt-1">{nextRequalification ? fmtDate(nextRequalification) : 'N/A'}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><ClipboardList size={15} /> Historique des contrôles</h3>
              <button onClick={() => setShowAddControle(s => !s)} className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                <Plus size={13} /> Ajouter un contrôle
              </button>
            </div>
            {showAddControle && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputCls} value={controle.date} onChange={e => setControle(c => ({ ...c, date: e.target.value }))} />
                  <select className={inputCls} value={controle.type} onChange={e => setControle(c => ({ ...c, type: e.target.value }))}>
                    <option value="inspection">Inspection périodique</option>
                    <option value="requalification">Requalification périodique</option>
                  </select>
                  <input className={inputCls} placeholder="Organisme" value={controle.organisme} onChange={e => setControle(c => ({ ...c, organisme: e.target.value }))} />
                  <input className={inputCls} placeholder="Résultat" value={controle.resultat} onChange={e => setControle(c => ({ ...c, resultat: e.target.value }))} />
                </div>
                <div>
                  <label className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-md px-3 py-4 cursor-pointer transition-colors ${controle.fichier ? 'border-teal-300 bg-teal-50' : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/40'}`}>
                    <input type="file" accept={ACCEPT_FICHIER} className="hidden" onChange={handleControleFichierChange} disabled={controleLoading} />
                    {controleLoading ? (
                      <span className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={16} className="animate-spin" /> Lecture du fichier…</span>
                    ) : controle.fichier ? (
                      <span className="flex items-center gap-2 text-xs font-medium text-teal-700">
                        <CheckCircle2 size={16} /> Pièce jointe : {controle.fichierNomOriginal} ({fmtTaille(controle.fichierTaille)})
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setControle(c => ({ ...c, fichier: null, fichierTaille: null, fichierExtension: null, fichierNomOriginal: null })); }}
                          className="ml-1 text-slate-400 hover:text-red-600" title="Retirer le fichier"
                        ><X size={14} /></button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-slate-500"><FileUp size={16} /> Joindre un justificatif (optionnel, max {fmtTaille(FICHIER_MAX_BYTES)})</span>
                    )}
                  </label>
                  {controleError && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {controleError}</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowAddControle(false); setControle({ ...CONTROLE_VIDE, organisme: eq.organismeHabilite || '' }); setControleError(''); }} className="px-3 py-1.5 text-xs text-slate-600">Annuler</button>
                  <button
                    onClick={() => { if (!controle.date) return; onAddControle(eq, controle); setControle({ ...CONTROLE_VIDE, organisme: eq.organismeHabilite || '' }); setControleError(''); setShowAddControle(false); }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-md">Ajouter</button>
                </div>
              </div>
            )}
            {(!eq.historique || eq.historique.length === 0) ? (
              <p className="text-sm text-slate-400 italic">Aucun contrôle enregistré.</p>
            ) : (
              <div className="border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
                {[...eq.historique].sort((a, b) => b.date.localeCompare(a.date)).map((h, i) => {
                  const label = h.type === 'inspection' ? 'Inspection périodique' : 'Requalification périodique';
                  const hasFichier = !!h.fichier;
                  return (
                    <button
                      key={i}
                      onClick={() => hasFichier && onViewDocument({ nom: `${label} — ${fmtDate(h.date)}`, type: label, date: h.date, fichier: h.fichier, fichierTaille: h.fichierTaille, fichierExtension: h.fichierExtension, fichierNomOriginal: h.fichierNomOriginal })}
                      disabled={!hasFichier}
                      title={hasFichier ? 'Voir la pièce jointe' : 'Aucun fichier joint à ce contrôle'}
                      className={`w-full px-3 py-2 flex items-center justify-between text-sm text-left ${hasFichier ? 'hover:bg-orange-50/60 cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-slate-500 mr-2">{fmtDate(h.date)}</span>
                        <span className="font-medium text-slate-800">{label}</span>
                        <span className="text-slate-500"> — {h.organisme || '—'}</span>
                        {hasFichier && <Paperclip size={12} className="inline ml-1.5 text-orange-500 align-text-top" />}
                      </div>
                      <span className="text-slate-500 text-xs shrink-0 pl-2">{h.resultat}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><FileText size={15} /> Documents associés</h3>
              <button onClick={() => setShowAddDoc(s => !s)} className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                <Plus size={13} /> Ajouter un document
              </button>
            </div>
            {showAddDoc && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 space-y-2">
                <div>
                  <label className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-md px-3 py-4 cursor-pointer transition-colors ${doc.fichier ? 'border-teal-300 bg-teal-50' : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/40'}`}>
                    <input type="file" accept={ACCEPT_FICHIER} className="hidden" onChange={handleDocFichierChange} disabled={docLoading} />
                    {docLoading ? (
                      <span className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={16} className="animate-spin" /> Lecture du fichier…</span>
                    ) : doc.fichier ? (
                      <span className="flex items-center gap-2 text-xs font-medium text-teal-700">
                        <CheckCircle2 size={16} /> Fichier joint : {doc.fichierNomOriginal} ({fmtTaille(doc.fichierTaille)})
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setDoc(d => ({ ...d, fichier: null, fichierTaille: null, fichierExtension: null, fichierNomOriginal: null })); }}
                          className="ml-1 text-slate-400 hover:text-red-600" title="Retirer le fichier"
                        ><X size={14} /></button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-slate-500"><FileUp size={16} /> Cliquer pour choisir un fichier — PDF, image, Word, Excel… (max {fmtTaille(FICHIER_MAX_BYTES)})</span>
                    )}
                  </label>
                  {docError && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {docError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls + ' col-span-2'} placeholder="Nom du document" value={doc.nom} onChange={e => setDoc(d => ({ ...d, nom: e.target.value }))} />
                  <select className={inputCls} value={doc.type} onChange={e => setDoc(d => ({ ...d, type: e.target.value }))}>
                    {TYPES_DOCUMENT.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="date" className={inputCls} value={doc.date} onChange={e => setDoc(d => ({ ...d, date: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowAddDoc(false); setDoc(DOC_VIDE); setDocError(''); }} className="px-3 py-1.5 text-xs text-slate-600">Annuler</button>
                  <button
                    onClick={() => { if (!doc.nom) return; onAddDocument(eq, doc); setDoc(DOC_VIDE); setDocError(''); setShowAddDoc(false); }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-md">Ajouter</button>
                </div>
              </div>
            )}
            {(!eq.documents || eq.documents.length === 0) ? (
              <p className="text-sm text-slate-400 italic">Aucun document associé.</p>
            ) : (
              <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                {eq.documents.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => d.fichier && onViewDocument(d)}
                    disabled={!d.fichier}
                    title={d.fichier ? 'Voir le document' : 'Aucun fichier joint à ce document'}
                    className={`w-full px-3 py-2 flex items-center justify-between text-sm text-left ${d.fichier ? 'hover:bg-orange-50/60 cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {d.fichier ? <Paperclip size={14} className="text-orange-500 shrink-0" /> : <FileText size={14} className="text-slate-300 shrink-0" />}
                      <span className="font-medium text-slate-800 truncate">{d.nom}</span>
                      {d.fichier && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1 py-0.5 uppercase tracking-wide shrink-0">{d.fichierExtension || 'fichier'}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0"><span>{d.type}</span><span className="font-mono">{fmtDate(d.date)}</span></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VUE TABLEAU DE BORD
   ============================================================ */
function Dashboard({ equipements, onSelect }) {
  const stats = useMemo(() => {
    const total = equipements.length;
    let conforme = 0, alerte = 0, nonConforme = 0;
    const parCategorie = { A: 0, B: 0, C: 0, EXEMPTE: 0 };
    equipements.forEach(eq => {
      parCategorie[eq.categorie] = (parCategorie[eq.categorie] || 0) + 1;
      const s = conformiteStatut(eq);
      if (s === 'conforme') conforme++; else if (s === 'alerte') alerte++; else nonConforme++;
    });
    return { total, conforme, alerte, nonConforme, parCategorie };
  }, [equipements]);

  const alertList = useMemo(() => {
    return equipements
      .map(eq => ({ eq, ...computeEcheances(eq) }))
      .filter(x => x.nextEcheance)
      .sort((a, b) => a.nextEcheance.localeCompare(b.nextEcheance))
      .filter(x => daysUntil(x.nextEcheance) <= 90);
  }, [equipements]);

  const pct = (n) => stats.total ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Équipements suivis</p>
          <p className="text-3xl font-bold text-slate-800 mt-1 font-mono">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conformes</p>
          <p className="text-3xl font-bold text-green-600 mt-1 font-mono">{pct(stats.conforme)}%</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.conforme} équipement(s)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">En alerte (&lt; 90 j)</p>
          <p className="text-3xl font-bold text-orange-600 mt-1 font-mono">{pct(stats.alerte)}%</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.alerte} équipement(s)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Non conformes</p>
          <p className="text-3xl font-bold text-red-700 mt-1 font-mono">{pct(stats.nonConforme)}%</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.nonConforme} équipement(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><AlertTriangle size={15} className="text-orange-600" /> Échéances à surveiller</h3>
          {alertList.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">Aucune échéance sous 90 jours.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {alertList.slice(0, 8).map(({ eq, nextEcheance, nextEcheanceType }) => (
                <button key={eq.id} onClick={() => onSelect(eq)} className="w-full flex items-center justify-between py-2.5 text-left hover:bg-slate-50 -mx-2 px-2 rounded">
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryBadge cat={eq.categorie} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{eq.nom}</p>
                      <p className="text-xs text-slate-400 font-mono">{eq.numeroIdentification} · {nextEcheanceType === 'inspection' ? 'Inspection' : 'Requalification'} · {fmtDate(nextEcheance)}</p>
                    </div>
                  </div>
                  <AlertPill days={daysUntil(nextEcheance)} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Répartition par catégorie</h3>
          <div className="space-y-3">
            {Object.entries(CATEGORIES).map(([k, v]) => {
              const count = stats.parCategorie[k] || 0;
              const width = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5"><CategoryBadge cat={k} />{v.name}</span>
                    <span className="font-mono text-slate-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: v.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VUE INVENTAIRE
   ============================================================ */
function Inventaire({ equipements, onSelect, onNew, onDelete }) {
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');

  const filtered = useMemo(() => {
    return equipements.filter(eq => {
      if (filterCat !== 'all' && eq.categorie !== filterCat) return false;
      if (filterStatut !== 'all' && conformiteStatut(eq) !== filterStatut) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return eq.nom.toLowerCase().includes(q) || eq.numeroIdentification.toLowerCase().includes(q) || (eq.atelier || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [equipements, query, filterCat, filterStatut]);

  const selectCls = "px-3 py-2 border border-slate-300 rounded-md text-sm bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Rechercher (nom, n° d'identification, atelier)…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className={selectCls} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
        <select className={selectCls} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="conforme">Conforme</option>
          <option value="alerte">En alerte</option>
          <option value="non_conforme">Non conforme</option>
        </select>
        <button onClick={onNew} className="ml-auto px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md flex items-center gap-1.5">
          <Plus size={15} /> Nouvel équipement
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun équipement ne correspond à ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(eq => {
            const { nextEcheance } = computeEcheances(eq);
            return (
              <Plaque key={eq.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" >
                <div onClick={() => onSelect(eq)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryBadge cat={eq.categorie} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{eq.nom}</p>
                        <p className="text-xs text-slate-500 font-mono">{eq.numeroIdentification}</p>
                      </div>
                    </div>
                    {nextEcheance ? <AlertPill days={daysUntil(nextEcheance)} /> : <span className="text-xs text-slate-400">N/A</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Gauge size={11} />{eq.ps || '—'} bar</span>
                    <span className="flex items-center gap-1"><Droplet size={11} />{eq.volume || '—'} L</span>
                    <span className="flex items-center gap-1 truncate"><MapPin size={11} />{eq.atelier || '—'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <StatutValidationBadge statut={eq.statutValidation} />
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </div>
              </Plaque>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   VUE CALENDRIER (liste triable des échéances)
   ============================================================ */
function CalendrierView({ equipements, onSelect }) {
  const [viewMode, setViewMode] = useState('liste');
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => {
    const list = equipements
      .map(eq => ({ eq, ...computeEcheances(eq) }))
      .filter(x => x.nextEcheance);
    list.sort((a, b) => sortAsc ? a.nextEcheance.localeCompare(b.nextEcheance) : b.nextEcheance.localeCompare(a.nextEcheance));
    return list;
  }, [equipements, sortAsc]);

  const monthGroups = useMemo(() => {
    const groups = {};
    rows.forEach(r => {
      const key = r.nextEcheance.slice(0, 7);
      groups[key] = groups[key] || [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('liste')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'liste' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Vue liste</button>
          <button onClick={() => setViewMode('mois')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'mois' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Vue calendrier (par mois)</button>
        </div>
        {viewMode === 'liste' && (
          <button onClick={() => setSortAsc(s => !s)} className="text-xs font-medium text-slate-500 flex items-center gap-1 hover:text-slate-700">
            Date d'échéance <ChevronDown size={13} className={sortAsc ? '' : 'rotate-180'} />
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucune échéance planifiée.</p>
        </div>
      ) : viewMode === 'liste' ? (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {rows.map(({ eq, nextEcheance, nextEcheanceType }) => (
            <button key={eq.id} onClick={() => onSelect(eq)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-20 shrink-0">
                  <p className="font-mono text-sm font-bold text-slate-800">{fmtDate(nextEcheance)}</p>
                </div>
                <CategoryBadge cat={eq.categorie} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{eq.nom}</p>
                  <p className="text-xs text-slate-400">{nextEcheanceType === 'inspection' ? 'Inspection périodique' : 'Requalification périodique'} · {eq.atelier}</p>
                </div>
              </div>
              <AlertPill days={daysUntil(nextEcheance)} />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {monthGroups.map(([month, items]) => (
            <div key={month} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <p className="text-sm font-bold text-slate-700 capitalize">
                  {new Date(month + '-01T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map(({ eq, nextEcheance, nextEcheanceType }) => (
                  <button key={eq.id} onClick={() => onSelect(eq)} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-500 w-14 shrink-0">{fmtDate(nextEcheance).slice(0, 5)}</span>
                      <CategoryBadge cat={eq.categorie} />
                      <span className="text-sm font-medium text-slate-800 truncate">{eq.nom}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{nextEcheanceType === 'inspection' ? 'Inspection' : 'Requalification'}</span>
                    </div>
                    <AlertPill days={daysUntil(nextEcheance)} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   VUE DOCUMENTS (vue transverse tous équipements)
   ============================================================ */
function DocumentsView({ equipements, onSelect, onViewDocument }) {
  const allDocs = useMemo(() => {
    const list = [];
    equipements.forEach(eq => {
      (eq.documents || []).forEach(d => list.push({ ...d, eq }));
      (eq.historique || []).forEach(h => {
        if (!h.fichier) return;
        const label = h.type === 'inspection' ? 'Inspection périodique' : 'Requalification périodique';
        list.push({
          nom: `${label} — ${fmtDate(h.date)}`, type: 'Pièce jointe de contrôle', date: h.date,
          fichier: h.fichier, fichierTaille: h.fichierTaille, fichierExtension: h.fichierExtension, fichierNomOriginal: h.fichierNomOriginal,
          eq,
        });
      });
    });
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [equipements]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-700">Documents associés — tous équipements ({allDocs.length})</h3>
      {allDocs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun document enregistré. Les documents et les pièces jointes de contrôle sont ajoutés depuis la fiche de chaque équipement.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {allDocs.map((d, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {d.fichier ? <Paperclip size={16} className="text-orange-500 shrink-0" /> : <FileText size={16} className="text-slate-300 shrink-0" />}
                <div className="min-w-0">
                  <button
                    onClick={() => d.fichier ? onViewDocument(d) : onSelect(d.eq)}
                    title={d.fichier ? 'Voir le document' : 'Aucun fichier joint — voir la fiche équipement'}
                    className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5 text-left hover:text-orange-700"
                  >
                    {d.nom}
                    {d.fichier && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1 py-0.5 uppercase tracking-wide shrink-0">{d.fichierExtension || 'fichier'}</span>}
                  </button>
                  <p className="text-xs text-slate-400 truncate">
                    {d.type} ·{' '}
                    <button onClick={() => onSelect(d.eq)} className="hover:text-orange-600 hover:underline">
                      {d.eq.nom} ({d.eq.numeroIdentification})
                    </button>
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-500 shrink-0 pl-3">{fmtDate(d.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APPLICATION PRINCIPALE
   ============================================================ */
export default function SuiviESP() {
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [detailEq, setDetailEq] = useState(null);
  const [formEq, setFormEq] = useState(undefined); // undefined = fermé, null = nouveau, objet = édition
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [viewDoc, setViewDoc] = useState(null); // document/pièce jointe actuellement affiché en pop-up
  const [saving, setSaving] = useState(false);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const initialized = await storageIsInitialized();
        if (!initialized) {
          const seed = buildSeedData();
          for (const eq of seed) { await storageSave(eq); }
          await storageSetInitialized();
          if (!cancelled) setEquipements(seed);
        } else {
          const data = await storageLoadAll();
          if (!cancelled) setEquipements(data.sort((a, b) => a.nom.localeCompare(b.nom)));
        }
      } catch (e) {
        if (!cancelled) showError('Erreur lors du chargement des données : ' + (e?.message || 'erreur inconnue'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showError]);

  async function persist(eq) {
    setSaving(true);
    try {
      const ok = await storageSave(eq);
      if (!ok) throw new Error('échec de la sauvegarde');
      setEquipements(prev => {
        const idx = prev.findIndex(e => e.id === eq.id);
        const next = idx >= 0 ? [...prev.slice(0, idx), eq, ...prev.slice(idx + 1)] : [...prev, eq];
        return next.sort((a, b) => a.nom.localeCompare(b.nom));
      });
      return true;
    } catch (e) {
      showError('Impossible d\'enregistrer l\'équipement : ' + (e?.message || 'erreur inconnue'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveForm(formData) {
    const isNew = !formData.id;
    const eq = {
      ...formData,
      id: formData.id || `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ok = await persist(eq);
    if (ok) { setFormEq(undefined); setDetailEq(eq); }
  }

  async function handleDelete(eq) {
    try {
      const ok = await storageDelete(eq.id);
      if (ok === null) throw new Error('échec de la suppression');
      setEquipements(prev => prev.filter(e => e.id !== eq.id));
      setDetailEq(null);
      setConfirmDeleteId(null);
    } catch (e) {
      showError('Impossible de supprimer l\'équipement : ' + (e?.message || 'erreur inconnue'));
    }
  }

  async function handleAddControle(eq, controle) {
    const updated = { ...eq, historique: [...(eq.historique || []), controle], updatedAt: new Date().toISOString() };
    const ok = await persist(updated);
    if (ok) setDetailEq(updated);
  }

  async function handleAddDocument(eq, doc) {
    const updated = { ...eq, documents: [...(eq.documents || []), doc], updatedAt: new Date().toISOString() };
    const ok = await persist(updated);
    if (ok) setDetailEq(updated);
  }

  async function handleReset() {
    try {
      const keys = await storageListEquipments();
      for (const k of keys) { await storageDelete(k.replace(STORAGE_PREFIX, '')); }
      await storageSetInitialized(); // reste initialisé : pas de re-seed automatique
      setEquipements([]);
      setConfirmReset(false);
    } catch (e) {
      showError('Impossible de réinitialiser les données : ' + (e?.message || 'erreur inconnue'));
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'inventaire', label: 'Inventaire', icon: Package },
    { id: 'calendrier', label: 'Calendrier', icon: CalendarDays },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans" style={{ minHeight: '640px' }}>
      {/* SIDEBAR */}
      <aside className="w-60 shrink-0 text-white flex flex-col" style={{ backgroundColor: '#0B1220' }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-orange-500" />
            <div>
              <p className="text-sm font-bold tracking-wide leading-tight">SUIVI ESP</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Équipements sous pression</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium transition-colors ${active ? 'text-white bg-white/10 border-r-2 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-[10px] text-slate-500 leading-relaxed">
          <p>Arrêté du 20/11/2017 relatif au suivi en service des ESP.</p>
          <p className="mt-1">Périodicités par défaut indicatives — à adapter selon plan d'inspection reconnu.</p>
        </div>
      </aside>

      {/* CONTENU */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-400">Contrôle réglementaire DREAL — suivi en service des équipements sous pression</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 size={13} className="animate-spin" /> Enregistrement…</span>}
            <button onClick={() => setConfirmReset(true)} className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-md">
              <RotateCcw size={13} /> Réinitialiser les données
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-md flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Chargement des données…</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard equipements={equipements} onSelect={setDetailEq} />}
              {activeTab === 'inventaire' && <Inventaire equipements={equipements} onSelect={setDetailEq} onNew={() => setFormEq(null)} />}
              {activeTab === 'calendrier' && <CalendrierView equipements={equipements} onSelect={setDetailEq} />}
              {activeTab === 'documents' && <DocumentsView equipements={equipements} onSelect={setDetailEq} onViewDocument={setViewDoc} />}
            </>
          )}
        </div>
      </main>

      {/* MODALES */}
      {formEq !== undefined && (
        <EquipmentForm
          initial={formEq}
          onCancel={() => setFormEq(undefined)}
          onSave={handleSaveForm}
        />
      )}

      {detailEq && !formEq && (
        <EquipmentDetail
          eq={detailEq}
          onClose={() => setDetailEq(null)}
          onEdit={(eq) => setFormEq(eq)}
          onDelete={(eq) => setConfirmDeleteId(eq.id)}
          onAddControle={handleAddControle}
          onAddDocument={handleAddDocument}
          onViewDocument={setViewDoc}
        />
      )}

      <DocumentViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-red-600" /> Supprimer cet équipement ?</h3>
            <p className="text-sm text-slate-500 mt-2">Cette action est irréversible. L'historique et les documents associés seront également supprimés.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button onClick={() => handleDelete(equipements.find(e => e.id === confirmDeleteId))} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-red-600" /> Réinitialiser toutes les données ?</h3>
            <p className="text-sm text-slate-500 mt-2">Tous les équipements, historiques et documents seront supprimés définitivement. Cette action est irréversible.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md">Réinitialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
