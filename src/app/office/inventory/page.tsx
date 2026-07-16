"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface InventoryItem {
  id: string;
  janCode: string;
  name: string;
  manufacturer: string;
  supplier: string | null;
  specification: string;
  unitsPerCase: number;
  expirationDate: string | null;
  stock: number;
}

const emptyForm = {
  janCode: "",
  name: "",
  manufacturer: "",
  supplier: "",
  specification: "",
  unitsPerCase: "",
  expirationDate: "",
};

export default function InventoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isMaster = session?.user?.role === "MASTER";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("在庫の取得に失敗しました。");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitsPerCase: Number(form.unitsPerCase),
          expirationDate: form.expirationDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "登録に失敗しました。");
      }
      setForm(emptyForm);
      setShowForm(false);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "削除に失敗しました。");
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">在庫管理</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 rounded-md bg-[#667eea] px-4 py-2 text-sm font-semibold text-white"
      >
        {showForm ? "キャンセル" : "+ 新規登録"}
      </button>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex max-w-lg flex-col gap-3 rounded-lg bg-white p-6 shadow-sm"
        >
          <h3 className="mb-2 text-base font-bold">新規アイテム登録</h3>
          <Field label="JANコード">
            <input
              required
              value={form.janCode}
              onChange={(e) => setForm({ ...form, janCode: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="商品名">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="メーカー">
            <input
              required
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="仕入先(任意)">
            <input
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="規格">
            <input
              required
              placeholder="例: 1ケース/12個入"
              value={form.specification}
              onChange={(e) => setForm({ ...form, specification: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="1ケースあたりの入数">
            <input
              required
              type="number"
              min={1}
              value={form.unitsPerCase}
              onChange={(e) => setForm({ ...form, unitsPerCase: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="賞味期限(任意)">
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
              className="input"
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-[#667eea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "登録"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">JANコード</th>
              <th className="px-4 py-3">商品名</th>
              <th className="px-4 py-3">メーカー</th>
              <th className="px-4 py-3">規格</th>
              <th className="px-4 py-3">現在庫数</th>
              <th className="px-4 py-3">賞味期限</th>
              {isMaster && <th className="px-4 py-3">操作</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  読み込み中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  在庫アイテムがありません。
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/office/inventory/${item.id}`)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{item.janCode}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.manufacturer}</td>
                  <td className="px-4 py-3">{item.specification}</td>
                  <td className="px-4 py-3">{item.stock}</td>
                  <td className="px-4 py-3">
                    {item.expirationDate
                      ? new Date(item.expirationDate).toLocaleDateString("ja-JP")
                      : "-"}
                  </td>
                  {isMaster && (
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id, item.name);
                        }}
                        className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white"
                      >
                        削除
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .input {
          padding: 0.55rem 0.75rem;
          border-radius: 6px;
          border: 1.5px solid #ddd;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}
