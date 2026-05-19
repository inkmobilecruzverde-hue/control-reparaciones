"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc,
} from "firebase/firestore";

type Pieza = {
  id?: string;
  nombre: string;
  categoria: string;
  marca: string;
  stock: number;
  compra: number;
  venta: number;
};

export default function StockPage() {
  const categorias = [
  "Pantallas",
  "Baterías",
  "Tapas Traseras",
  "Flex de Carga",
  "PCB Carga",
  "Flex Botoneras",
  "Cámaras",
  "Lentes Cámara",
  "Flex Unión Placa",
  "Auriculares",
  "Altavoces",
  "Micrófonos",
  "SIM",
  "Face ID",
  "Huella",
  "Otros",
];
  const marcas = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "Oppo",
  "Realme",
  "Motorola",
  "Vivo",
  "Honor",
  "Nokia",
  "LG",
  "Otros",
];
  const [piezas, setPiezas] =
  
  
    useState<Pieza[]>([]);
    const [filtroStock, setFiltroStock] =
  useState("Todos");
const [editando, setEditando] =
  useState<string | null>(null);

const [editForm, setEditForm] =
  useState<any>({});
const [filtroCategoria, setFiltroCategoria] =
  useState("Todas");
  const [busqueda, setBusqueda] =
  useState("");
  const [form, setForm] = useState<{
  nombre: string;
  categoria: string;
  marca: string;
  stock: string;
  compra: string;
  venta: string;
}>({
  nombre: "",
  categoria: "Pantallas",
  marca: "Apple",
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
    categoria: form.categoria,
    marca: form.marca,
    stock: Number(form.stock),
    compra: Number(form.compra),
    venta: Number(form.venta),
  }
);

    setForm({
      nombre: "",
      categoria: "Pantallas",
      marca: "Apple",
      stock: "",
      compra: "",
      venta: "",
    });

    cargarPiezas();
  };
const eliminarPieza = async (id: string) => {

  await deleteDoc(doc(db, "stock", id));

  cargarPiezas();
};

const actualizarStock = async (
  id: string,
  campo: string,
  valor: number
) => {

  await updateDoc(
    doc(db, "stock", id),
    {
      [campo]: valor,
    }
  );

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
        <select
  className="border p-2 w-full"
  value={form.categoria}
  onChange={(e) =>
    setForm({
      ...form,
      categoria: e.target.value,
    })
  }
>

  {categorias.map((c) => (
    <option key={c}>
      {c}
    </option>
  ))}

</select>
<select
  className="border p-2 w-full"
  value={form.marca}
  onChange={(e) =>
    setForm({
      ...form,
      marca: e.target.value,
    })
  }
>

  {marcas.map((m) => (
    <option key={m}>
      {m}
    </option>
  ))}

</select>
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
<input
  className="border p-2 w-full mb-4"
  placeholder="🔍 Buscar pieza..."
  
  value={busqueda}
  onChange={(e) =>
    setBusqueda(e.target.value)
  }
/>
<div className="flex gap-2 mb-4">

  <select
    className="border p-2 rounded"
    value={filtroStock}
    onChange={(e) =>
      setFiltroStock(e.target.value)
    }
  >
    <option>Todos</option>
    <option>Sin stock</option>
    <option>Con stock</option>
  </select>

  <select
    className="border p-2 rounded"
    value={filtroCategoria}
    onChange={(e) =>
      setFiltroCategoria(e.target.value)
    }
  >
    <option>Todas</option>

    {categorias.map((c) => (
      <option key={c}>
        {c}
      </option>
    ))}

  </select>

</div>
      <div className="space-y-3">

        {piezas
  .filter((p) => {

  const coincideBusqueda =
    p.nombre
      .toLowerCase()
      .includes(
        busqueda.toLowerCase()
      );

  const coincideStock =
    filtroStock === "Todos"
    || (
      filtroStock === "Sin stock"
      && p.stock <= 0
    )
    || (
      filtroStock === "Con stock"
      && p.stock > 0
    );

  const coincideCategoria =
    filtroCategoria === "Todas"
    || p.categoria === filtroCategoria;

  return (
    coincideBusqueda &&
    coincideStock &&
    coincideCategoria
  );

})
  .map((p) => (

          <div
            key={p.id}
            className="bg-white rounded shadow p-4 flex justify-between items-center"
          >

            <div>

              <p className="font-bold">
                {p.nombre}
              </p>
{p.stock <= 0 && (
  <div className="bg-red-600 text-white text-xs px-2 py-1 rounded mt-1 inline-block">
    ❌ SIN STOCK
  </div>
)}


              <div className="flex items-center gap-2 mt-2">

  <button
    onClick={() =>
      actualizarStock(
        p.id!,
        "stock",
        p.stock - 1
      )
    }
    className="bg-red-500 text-white px-2 rounded"
  >
    -
  </button>

  <span>
    Stock: {p.stock}
  </span>

  <button
    onClick={() =>
      actualizarStock(
        p.id!,
        "stock",
        p.stock + 1
      )
    }
    className="bg-green-600 text-white px-2 rounded"
  >
    +
  </button>

</div>

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
<button
  onClick={() =>
    eliminarPieza(p.id!)
  }
  className="bg-red-600 text-white px-3 py-1 rounded mt-2"
>
  ❌ Eliminar
</button>

<button
  onClick={() => {

  setEditando(p.id!);

  setEditForm({
    nombre: p.nombre,
    categoria: p.categoria,
    marca: p.marca,
    stock: p.stock,
    compra: p.compra,
    venta: p.venta,
  });

}}
  className="bg-blue-600 text-white px-3 py-1 rounded mt-2 ml-2"
>
  ✏ Editar
</button>
{editando === p.id && (

  <div className="mt-4 space-y-2">

    <input
      className="border p-2 w-full"
      value={editForm.nombre}
      onChange={(e) =>
        setEditForm({
          ...editForm,
          nombre: e.target.value,
        })
      }
    />

    <select
      className="border p-2 w-full"
      value={editForm.categoria}
      onChange={(e) =>
        setEditForm({
          ...editForm,
          categoria: e.target.value,
        })
      }
    >
      {categorias.map((cat) => (
        <option key={cat}>
          {cat}
        </option>
      ))}
    </select>

    <select
      className="border p-2 w-full"
      value={editForm.marca}
      onChange={(e) =>
        setEditForm({
          ...editForm,
          marca: e.target.value,
        })
      }
    >
      {marcas.map((m) => (
        <option key={m}>
          {m}
        </option>
      ))}
    </select>

    <input
      type="number"
      className="border p-2 w-full"
      value={editForm.compra}
      onChange={(e) =>
        setEditForm({
          ...editForm,
          compra: e.target.value,
        })
      }
    />

    <input
      type="number"
      className="border p-2 w-full"
      value={editForm.venta}
      onChange={(e) =>
        setEditForm({
          ...editForm,
          venta: e.target.value,
        })
      }
    />

    <button
      onClick={async () => {

        await updateDoc(
          doc(db, "stock", p.id!),
          {
            nombre: editForm.nombre,
            categoria: editForm.categoria,
            marca: editForm.marca,
            compra: Number(editForm.compra),
            venta: Number(editForm.venta),
          }
        );

        setEditando(null);

        cargarPiezas();

      }}
      className="bg-green-600 text-white px-3 py-2 rounded"
    >
      💾 Guardar cambios
    </button>

  </div>

)}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}