/* eslint-disable @next/next/no-img-element -- Map tiles are already-sized raster assets. */
"use client";

import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { SocialPost } from "@/lib/social/get-posts";
import { skateboardMarkerHtml } from "@/components/maps/leaflet-map-theme";
import mapTheme from "@/components/maps/leaflet-map-theme.module.scss";
import { cn } from "@/lib/utils";
import styles from "./social.module.scss";

export function PostMapDrawer({
  pin,
  variant = "button",
}: {
  pin: NonNullable<SocialPost["mapPin"]>;
  variant?: "button" | "preview";
}) {
  const [open, setOpen] = useState(false),
    [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open || !mapNode) return;
    let disposed = false,
      cleanup = () => {};
    void import("leaflet").then((L) => {
      if (disposed) return;
      const bounds = L.latLngBounds(pin.bounds),
        map = L.map(mapNode, {
          crs: L.CRS.Simple,
          zoomControl: true,
          attributionControl: false,
          minZoom: pin.minZoom,
          maxZoom: pin.maxZoom,
          maxBounds: bounds,
          maxBoundsViscosity: 1,
        });
      L.tileLayer(`${pin.assetRoot}/${pin.tileUrl}`, {
        tileSize: 256,
        minZoom: pin.minZoom,
        maxZoom: pin.maxZoom,
        maxNativeZoom: pin.maxZoom,
        noWrap: true,
        bounds,
      }).addTo(map);
      const [[minLat, minLng], [maxLat, maxLng]] = pin.bounds,
        point: L.LatLngTuple = [
          maxLat - (pin.y / 100) * (maxLat - minLat),
          minLng + (pin.x / 100) * (maxLng - minLng),
        ];
      L.marker(point, {
        icon: L.divIcon({
          className: "skate-map-marker",
          iconSize: [46, 46],
          iconAnchor: [23, 42],
          html: skateboardMarkerHtml,
        }),
      }).addTo(map);
      map.fitBounds(bounds, { animate: false });
      const resize = () => {
        map.invalidateSize();
        map.setView(point, Math.max(pin.minZoom, Math.min(pin.maxZoom, 4)), {
          animate: false,
        });
      };
      const timers = [
        window.setTimeout(resize, 50),
        window.setTimeout(resize, 500),
      ];
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(mapNode);
      cleanup = () => {
        timers.forEach(window.clearTimeout);
        observer.disconnect();
        map.remove();
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [open, pin, mapNode]);
  const zoom = Math.max(pin.minZoom, Math.min(pin.maxZoom, 4)),
    scale = 2 ** zoom,
    [[, minLng], [maxLat]] = pin.bounds,
    lng = minLng + (pin.x / 100) * (pin.bounds[1][1] - minLng),
    lat = maxLat - (pin.y / 100) * (maxLat - pin.bounds[0][0]),
    pixelX = lng * scale,
    pixelY = -lat * scale,
    tileX = Math.floor(pixelX / 256),
    tileY = Math.floor(pixelY / 256),
    tiles = [-1, 0, 1].flatMap((row) =>
      [-1, 0, 1].map((column) => ({
        x: tileX + column,
        y: tileY + row,
        column,
        row,
      })),
    );
  const trigger =
    variant === "preview" ? (
      <DrawerTrigger
        className={styles.mapPreview}
        style={{
          background:
            "radial-gradient(ellipse at 48% 48%,rgba(13,83,103,.98) 0%,rgba(7,52,73,.98) 34%,#062c47 62%,#041a2f 100%)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className={styles.mapPreviewTiles}
          style={{
            transform: `translate(calc(-50% + ${128 - (pixelX - tileX * 256)}px),calc(-50% + ${128 - (pixelY - tileY * 256)}px))`,
          }}
        >
          {tiles.map((tile) => (
            <img
              src={`${pin.assetRoot}/${pin.tileUrl.replace("{z}", String(zoom)).replace("{x}", String(tile.x)).replace("{y}", String(tile.y))}`}
              alt=""
              style={{ gridColumn: tile.column + 2, gridRow: tile.row + 2 }}
              key={`${tile.x}:${tile.y}`}
            />
          ))}
        </span>
        <i>
          <MapPin />
        </i>
        <strong>{pin.mapName}</strong>
        <small>View pinned spot</small>
      </DrawerTrigger>
    ) : (
      <DrawerTrigger
        className={styles.locationButton}
        onClick={(event) => event.stopPropagation()}
      >
        <MapPin />
        Pinned on {pin.mapName}
      </DrawerTrigger>
    );
  return (
    <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
      {trigger}
      <DrawerContent className={styles.mapDrawer}>
        <DrawerHeader>
          <div>
            <DrawerTitle>{pin.mapName}</DrawerTitle>
            <DrawerDescription>
              The exact location pinned to this post.
            </DrawerDescription>
          </div>
          <DrawerClose aria-label="Close map">
            <X />
          </DrawerClose>
        </DrawerHeader>
        <div
          ref={setMapNode}
          className={cn(styles.postMapCanvas, mapTheme.canvas)}
        />
      </DrawerContent>
    </Drawer>
  );
}
