"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";

import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

type Pieza = {
  id?: string;
  nombre: string;
  stock: number;
  compra: number;
  venta: number;
};

export default function StockPage() {

  const [piezas, setPiezas] =
    useState<Pieza[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    stock: "",
    compra: "",
    venta: "",
  });

  const cargarPiezas = async () => {

    const snapshot = await getDocs(
      collection(db, "stock")
    );

    const datos = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Pieza),
    }));

    setPiezas(datos);
  };

  useEffect(() => {
    cargarPiezas();
  }, []);

  const crearPieza = async () => {

    if (!form.nombre) return;

    await addDoc(
  collection(db, "stock"),
  {
    nombre: form.nombre,
    stock: Number(form.stock),
    compra: Number(form.compra),
    venta: Number(form.venta),
  }
);

    setForm({
      nombre: "",
      stock: "",
      compra: "",
      venta: "",
    });

    cargarPiezas();
  };

  return (
    <div className="max-w-5xl mx-auto p-4">

      <h1 className="text-3xl font-bold mb-4">
        📦 Stock / Recambios
      </h1>

      <div className="bg-white p-4 rounded shadow space-y-2 mb-6">

        <input
          className="border p-2 w-full"
          placeholder="Nombre pieza"
          value={form.nombre}
          onChange={(e) =>
            setForm({
              ...form,
              nombre: e.target.value,
            })
          }
        />

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) =>
            setForm({
              ...form,
              stock: (e.target.value),
            })
          }
        />

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Precio compra (€)"
          value={form.compra}
          onChange={(e) =>
            setForm({
              ...form,
              compra: (e.target.value),
            })
          }
        />

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Precio venta (€)"
          value={form.venta}
          onChange={(e) =>
            setForm({
              ...form,
              venta: (e.target.value),
            })
          }
        />

        <button
          onClick={crearPieza}
          className="bg-blue-600 text-white p-2 rounded w-full"
        >
          ➕ Añadir pieza
        </button>

      </div>

      <div className="space-y-3">

        {piezas.map((p) => (

          <div
            key={p.id}
            className="bg-white rounded shadow p-4 flex justify-between items-center"
          >

            <div>

              <p className="font-bold">
                {p.nombre}
              </p>

              <p className="text-sm text-gray-600">
                Stock: {p.stock}
              </p>

            </div>

            <div className="text-right">

              <p>
                Compra: {p.compra} €
              </p>

              <p>
                Venta: {p.venta} €
              </p>

              <p className="font-bold text-green-600">
                Beneficio: {p.venta - p.compra} €
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}