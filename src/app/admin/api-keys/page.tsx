import { ApiKeyManager } from "@/components/organisms/admin/ApiKeyManager";

export default function ApiKeysPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-100">Gestion des Clés API</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configurez les fournisseurs d&apos;IA et gérez les clés directement sur Vercel.
        </p>
      </div>
      <ApiKeyManager />
    </div>
  );
}
