/*
|--------------------------------------------------------------------------
| CONTEXTO: CartContext — Carrito de compras global
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un Context en React?
|
|   Es una forma de compartir datos entre componentes sin pasar props
|   manualmente por cada nivel. El carrito necesita ser visible en:
|     - TiendaLayout (icono con contador en navbar)
|     - Producto.jsx (botón "agregar al carrito")
|     - Carrito.jsx (lista de items)
|
| PENSAR — ¿Dónde se guarda el carrito?
|
|   En localStorage del navegador. Ventaja: sobrevive si el usuario
|   cierra y abre el navegador. Se sincroniza con React state.
|
| USO:
|   import { useCart } from '@/Context/CartContext';
|   const { items, agregarItem, totalItems } = useCart();
|
*/

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'gadget_carrito';

export function CartProvider({ children }) {

    // Inicializar desde localStorage
    const [items, setItems] = useState(() => {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            return guardado ? JSON.parse(guardado) : [];
        } catch {
            return [];
        }
    });

    // Sincronizar con localStorage cada vez que cambien los items
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // ── AGREGAR ITEM ──────────────────────────────────────────────────────
    // Si ya existe el producto, suma la cantidad
    const agregarItem = (producto) => {
        setItems(prev => {
            const existe = prev.find(i => i.id === producto.id);
            if (existe) {
                return prev.map(i =>
                    i.id === producto.id
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                );
            }
            return [...prev, {
                id:                    producto.id,
                nombre:                producto.nombre,
                slug:                  producto.slug,
                precio:                producto.precio_venta,
                imagen:                producto.imagen,
                // Guardamos si el producto permite pago contra entrega.
                // Si no se pasa el campo (items viejos en localStorage) asumimos true.
                permite_contraentrega: producto.permite_contraentrega ?? true,
                cantidad:              1,
            }];
        });
    };

    // ── CAMBIAR CANTIDAD ──────────────────────────────────────────────────
    const cambiarCantidad = (id, cantidad) => {
        if (cantidad < 1) return eliminarItem(id);
        setItems(prev =>
            prev.map(i => i.id === id ? { ...i, cantidad } : i)
        );
    };

    // ── ELIMINAR ITEM ─────────────────────────────────────────────────────
    const eliminarItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // ── VACIAR CARRITO ────────────────────────────────────────────────────
    const vaciarCarrito = () => setItems([]);

    // ── TOTALES ───────────────────────────────────────────────────────────
    const totalItems    = items.reduce((s, i) => s + i.cantidad, 0);
    const subtotal      = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);

    return (
        <CartContext.Provider value={{
            items,
            agregarItem,
            cambiarCantidad,
            eliminarItem,
            vaciarCarrito,
            totalItems,
            subtotal,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
    return ctx;
}
