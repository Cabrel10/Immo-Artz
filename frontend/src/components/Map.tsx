import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix pour les icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface MapProps {
  latitude: number
  longitude: number
  zoom?: number
  height?: string
  markers?: Array<{
    lat: number
    lng: number
    title?: string
    popup?: string
  }>
}

export function Map({ 
  latitude, 
  longitude, 
  zoom = 15, 
  height = '300px',
  markers = []
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Créer la carte
    leafletMap.current = L.map(mapRef.current).setView([latitude, longitude], zoom)

    // Ajouter le layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMap.current)

    // Ajouter le marqueur principal
    L.marker([latitude, longitude])
      .addTo(leafletMap.current)
      .bindPopup('Emplacement du bien')
      .openPopup()

    // Ajouter les marqueurs supplémentaires
    markers.forEach((marker) => {
      if (leafletMap.current) {
        L.marker([marker.lat, marker.lng])
          .addTo(leafletMap.current)
          .bindPopup(marker.popup || marker.title || 'Marqueur')
      }
    })

    // Cleanup
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [latitude, longitude, zoom, markers])

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }} 
      className="rounded-lg z-0"
    />
  )
}

// Composant pour afficher plusieurs biens sur une carte
interface PropertiesMapProps {
  properties: Array<{
    id: number
    title: string
    latitude?: number
    longitude?: number
    price: string
  }>
  height?: string
  center?: { lat: number; lng: number }
}

export function PropertiesMap({ properties, height = '400px', center }: PropertiesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)

  // Filtrer les propriétés avec coordonnées
  const validProperties = properties.filter(p => p.latitude && p.longitude)

  // Calculer le centre si non fourni
  const mapCenter = center || (validProperties.length > 0 
    ? {
        lat: validProperties.reduce((sum, p) => sum + (p.latitude || 0), 0) / validProperties.length,
        lng: validProperties.reduce((sum, p) => sum + (p.longitude || 0), 0) / validProperties.length,
      }
    : { lat: 3.848, lng: 11.502 } // Douala par défaut
  )

  useEffect(() => {
    if (!mapRef.current) return

    leafletMap.current = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMap.current)

    // Ajouter les marqueurs pour chaque bien
    validProperties.forEach((property) => {
      if (leafletMap.current && property.latitude && property.longitude) {
        const marker = L.marker([property.latitude, property.longitude])
          .addTo(leafletMap.current)
          .bindPopup(`
            <div style="min-width: 150px;">
              <strong>${property.title}</strong><br/>
              <span style="color: #0ea5e9; font-weight: bold;">${property.price}</span>
            </div>
          `)
        
        // Ouvrir le popup au clic
        marker.on('click', () => {
          marker.openPopup()
        })
      }
    })

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [properties, mapCenter])

  if (validProperties.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
      >
        <p className="text-gray-500">Aucune localisation disponible</p>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }} 
      className="rounded-lg z-0"
    />
  )
}