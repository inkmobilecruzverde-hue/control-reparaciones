"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function Consulta() {

  const [telefono, setTelefono] =
    useState("");

  const [numero, setNumero] =
    useState("");

  const [orden, setOrden] =
    useState<any>(null);
  
   useEffect(() => {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const telefonoURL =
    params.get("telefono");

  const ordenURL =
    params.get("orden");

  if (
    telefonoURL &&
    ordenURL
  ) {

    setTelefono(telefonoURL);

    setNumero(ordenURL);

    setTimeout(() => {
      buscarOrden();
    }, 300);

  }

}, []);
  const buscarOrden = async () => {

    const snapshot = await getDocs(
      collection(db, "ordenes")
    );

    const encontrada = snapshot.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .find(
        (o: any) =>
          o.telefono === telefono &&
          o.numero === numero
      );

    if (encontrada) {
      setOrden(encontrada);
    } else {
      alert("Orden no encontrada");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-3xl font-bold text-center">
        🛠️ Consulta reparación
      </h1>

      <input
        className="border p-2 w-full"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) =>
          setTelefono(e.target.value)
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Número orden"
        value={numero}
        onChange={(e) =>
          setNumero(e.target.value)
        }
      />

      <button
        onClick={buscarOrden}
        className="bg-blue-600 text-white p-2 w-full rounded"
      >
        Consultar
      </button>

      {orden && (
        <div className="border rounded p-4 space-y-2 bg-white shadow">

          <p>
            <b>Cliente:</b> {orden.nombre}
          </p>

          <p>
            <b>Modelo:</b> {orden.modelo}
          </p>

          <p>
            <b>Estado:</b> {orden.estado}
          </p>

          <p>
            <b>Presupuesto:</b>{" "}
            {orden.presupuesto || "-"} €
          </p>

        </div>
      )}

    </div>
  );
}