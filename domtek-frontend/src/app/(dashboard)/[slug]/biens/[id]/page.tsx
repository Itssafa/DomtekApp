'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Bien, BienDocument, BienImage, Immeuble } from '@/types';

const TYPES_BIEN = [
  { value: 'appartement',      label: 'Appartement' },
  { value: 'maison',           label: 'Maison' },
  { value: 'villa',            label: 'Villa' },
  { value: 'bureau',           label: 'Bureau' },
  { value: 'terrain',          label: 'Terrain' },
  { value: 'studio',           label: 'Studio' },
  { value: 'duplex',           label: 'Duplex' },
  { value: 'local_commercial', label: 'Local commercial' },
  { value: 'entrepot',         label: 'Entrepôt' },
  { value: 'ferme',            label: 'Ferme' },
  { value: 'autre',            label: 'Autre' },
];

const OPTIONS_BIEN = [
  { key: 'garage',            label: 'Garage' },
  { key: 'jardin',            label: 'Jardin' },
  { key: 'piscine',           label: 'Piscine' },
  { key: 'chauffage_central', label: 'Chauffage central' },
  { key: 'gaz_ville',         label: 'Gaz de ville' },
  { key: 'ascenseur',         label: 'Ascenseur' },
  { key: 'cave',              label: 'Cave' },
  { key: 'terrasse',          label: 'Terrasse' },
  { key: 'balcon',            label: 'Balcon' },
  { key: 'parking',           label: 'Parking' },
  { key: 'climatisation',     label: 'Climatisation' },
  { key: 'gardien',           label: 'Gardien' },
  { key: 'interphone',        label: 'Interphone' },
  { key: 'digicode',          label: 'Digicode' },
];

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

export default function BienShowPage() {
  const { id } = useParams<{ id: string }>();

  const [bien, setBien]           = useState<Bien | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [options, setOptions]     = useState<string[]>([]);
  const [form, setFormData]       = useState({
    designation: '', description: '', notes: '',
    type_transaction: 'loyer', type_location: '', type_bien: 'appartement',
    prix: '', taxe_fonciere: '', regime_juridique: '',
    superficie: '', nb_pieces: '', nb_chambres: '', nb_salles_bain: '',
    adresse: '', ville: '', pays: '', code_postal: '',
    etage: '', bloc: '', num: '',
    immeuble_id: null as number | null,
    accepte_animaux: false, accepte_fumeurs: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Bien }>(`/org/biens/${id}`),
      api.get('/org/immeubles?per_page=200'),
    ]).then(([bienRes, immRes]) => {
      const b = bienRes.data.data;
      setBien(b);
      setImmeubles(immRes.data.data ?? []);
      setOptions(b.options ?? []);
      setFormData({
        designation:      b.designation,
        description:      b.description ?? '',
        notes:            b.notes ?? '',
        type_transaction: b.type_transaction,
        type_location:    b.type_location ?? '',
        type_bien:        b.type_bien,
        prix:             String(b.prix),
        taxe_fonciere:    String(b.taxe_fonciere ?? ''),
        regime_juridique: b.regime_juridique ?? '',
        superficie:       String(b.superficie ?? ''),
        nb_pieces:        String(b.nb_pieces ?? ''),
        nb_chambres:      String(b.nb_chambres ?? ''),
        nb_salles_bain:   String(b.nb_salles_bain ?? ''),
        adresse:          b.adresse ?? '',
        ville:            b.ville ?? '',
        pays:             b.pays ?? '',
        code_postal:      b.code_postal ?? '',
        etage:            String(b.etage ?? ''),
        bloc:             String(b.bloc ?? ''),
        num:              b.num ?? '',
        immeuble_id:      b.immeuble_id ?? null,
        accepte_animaux:  b.accepte_animaux,
        accepte_fumeurs:  b.accepte_fumeurs,
      });
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
    </div>
  );
  if (!bien) return <div className="p-8"><p className="text-red-600 font-semibold">Bien introuvable.</p></div>;

  const typeBienLabel = TYPES_BIEN.find(t => t.value === form.type_bien)?.label ?? form.type_bien;
  const selectedImmeuble = immeubles.find(i => i.id === form.immeuble_id) ?? null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/biens" className="text-sm text-gray-400 hover:text-gray-600">← Retour aux biens</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-800">{form.designation}</h1>
          <Link href={`/dashboard/biens/${id}/modifier`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            Modifier
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-5">
        <Section title="Identification" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Type de bien" value={typeBienLabel} />
          <Field label="Transaction" value={form.type_transaction === 'vente' ? 'Vente' : 'Location'} />
          {form.type_transaction === 'loyer' && (
            <Field label="Type de location" value={form.type_location === 'meuble' ? 'Meublé' : form.type_location === 'non_meuble' ? 'Non meublé' : '—'} />
          )}
        </div>

        <Section title="Localisation" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Adresse" value={form.adresse} />
          <Field label="Ville" value={form.ville} />
          <Field label="Pays" value={form.pays} />
          <Field label="Code postal" value={form.code_postal} />
        </div>
        {selectedImmeuble && (
          <div className="grid grid-cols-3 gap-4">
            <Field label="Immeuble" value={selectedImmeuble.nom} />
            <Field label="Étage" value={form.etage} />
            {form.bloc && <Field label="Bloc" value={form.bloc} />}
            {form.num && <Field label="N° appt" value={form.num} />}
          </div>
        )}

        <Section title="Caractéristiques" />
        <div className="grid grid-cols-4 gap-4">
          <Field label="Superficie (m²)" value={form.superficie} />
          <Field label="Pièces" value={form.nb_pieces} />
          <Field label="Chambres" value={form.nb_chambres} />
          <Field label="Salles de bain" value={form.nb_salles_bain} />
        </div>

        <Section title="Finance" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Prix (TND)" value={form.prix ? `${Number(form.prix).toLocaleString('fr-TN')} TND` : '—'} />
          {form.taxe_fonciere && <Field label="Taxe foncière" value={`${form.taxe_fonciere} TND/an`} />}
          {form.regime_juridique && <Field label="Régime juridique" value={form.regime_juridique === 'mono_propriete' ? 'Mono-propriété' : 'Co-propriété'} />}
        </div>

        <div className="flex gap-3 flex-wrap">
          {form.accepte_animaux && <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Animaux acceptés</span>}
          {form.accepte_fumeurs && <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Fumeurs acceptés</span>}
        </div>

        {options.length > 0 && (
          <>
            <Section title="Équipements" />
            <div className="flex flex-wrap gap-2">
              {options.map(opt => (
                <span key={opt} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {OPTIONS_BIEN.find(o => o.key === opt)?.label ?? opt}
                </span>
              ))}
            </div>
          </>
        )}

        {form.description && (
          <>
            <Section title="Description" />
            <p className="text-sm text-gray-700 whitespace-pre-line">{form.description}</p>
          </>
        )}
        {form.notes && (
          <>
            <Section title="Notes internes" />
            <p className="text-sm text-gray-500 whitespace-pre-line">{form.notes}</p>
          </>
        )}
      </div>

      {bien.images && bien.images.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Photos ({bien.images.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {bien.images.map((img: BienImage) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                {img.is_principale && (
                  <span className="absolute top-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Principale</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {bien.documents && bien.documents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Documents ({bien.documents.length})</h2>
          <div className="space-y-2">
            {bien.documents.map((doc: BienDocument) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-lg">📄</span>
                <a href={doc.url} target="_blank" rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline truncate flex-1">{doc.nom}</a>
                {doc.type_document && <span className="text-xs text-gray-400">{doc.type_document}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
