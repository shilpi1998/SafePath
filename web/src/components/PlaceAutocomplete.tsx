"use client";
import { useEffect, useRef, useState } from "react";

interface PlaceAutocompleteProps {
  value: string;
  onPlaceSelect: (name: string, lat: number, lng: number) => void;
  placeholder?: string;
  dark?: boolean;
}

export default function PlaceAutocomplete({ value, onPlaceSelect, placeholder = "Search location...", dark }: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return; // already initialized

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      componentRestrictions: { country: "in" },
      fields: ["name", "geometry", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const name = place.name || place.formatted_address || inputRef.current?.value || "";
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setInputValue(name);
        onPlaceSelect(name, lat, lng);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={dark
        ? "flex-1 bg-white/5 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-500"
        : "flex-1 bg-white text-gray-900 text-sm font-medium rounded-lg px-3 py-2 border border-gray-200 focus:border-blue-400 focus:outline-none placeholder:text-gray-500"
      }
    />
  );
}
