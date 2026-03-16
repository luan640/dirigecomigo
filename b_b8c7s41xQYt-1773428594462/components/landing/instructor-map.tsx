"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin, Search, Navigation, Star, Car, Phone } from "lucide-react"

interface Instructor {
  id: number
  name: string
  photo: string
  rating: number
  reviews: number
  specialties: string[]
  distance: string
  lat: number
  lng: number
  phone: string
}

const mockInstructors: Instructor[] = [
  {
    id: 1,
    name: "Carlos Silva",
    photo: "/images/instructor-1.jpg",
    rating: 4.9,
    reviews: 127,
    specialties: ["Medo de dirigir", "Baliza"],
    distance: "1.2 km",
    lat: -23.5505,
    lng: -46.6333,
    phone: "(11) 99999-1111",
  },
  {
    id: 2,
    name: "Ana Oliveira",
    photo: "/images/instructor-2.jpg",
    rating: 4.8,
    reviews: 98,
    specialties: ["Primeira habilitação", "Estradas"],
    distance: "2.5 km",
    lat: -23.5605,
    lng: -46.6433,
    phone: "(11) 99999-2222",
  },
  {
    id: 3,
    name: "Roberto Santos",
    photo: "/images/instructor-3.jpg",
    rating: 4.7,
    reviews: 156,
    specialties: ["Reciclagem", "Direção defensiva"],
    distance: "3.1 km",
    lat: -23.5405,
    lng: -46.6233,
    phone: "(11) 99999-3333",
  },
  {
    id: 4,
    name: "Fernanda Lima",
    photo: "/images/instructor-4.jpg",
    rating: 5.0,
    reviews: 89,
    specialties: ["Medo de dirigir", "Trânsito intenso"],
    distance: "4.0 km",
    lat: -23.5705,
    lng: -46.6533,
    phone: "(11) 99999-4444",
  },
  {
    id: 5,
    name: "Lucas Mendes",
    photo: "/images/instructor-5.jpg",
    rating: 4.6,
    reviews: 72,
    specialties: ["Primeira habilitação", "Baliza"],
    distance: "5.2 km",
    lat: -23.5305,
    lng: -46.6133,
    phone: "(11) 99999-5555",
  },
]

export function InstructorMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    const initMap = async () => {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      if (mapRef.current && !mapInstance) {
        const map = L.map(mapRef.current).setView([-23.5505, -46.6333], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        const markers = L.layerGroup().addTo(map)
        setMarkersLayer(markers)
        setMapInstance(map)

        // Add instructor markers
        mockInstructors.forEach((instructor) => {
          const customIcon = L.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                background: linear-gradient(135deg, #22c55e, #16a34a);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
                border: 3px solid white;
                cursor: pointer;
              ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          })

          const marker = L.marker([instructor.lat, instructor.lng], { icon: customIcon }).addTo(markers)

          marker.on("click", () => {
            setSelectedInstructor(instructor)
            map.setView([instructor.lat, instructor.lng], 15)
          })
        })
      }
    }

    initMap()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [])

  const handleGetLocation = async () => {
    setIsLocating(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })

          if (mapInstance) {
            const L = (await import("leaflet")).default

            const userIcon = L.divIcon({
              className: "user-marker",
              html: `
                <div style="
                  background: #3b82f6;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 4px solid white;
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.2);
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })

            L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance)
            mapInstance.setView([latitude, longitude], 14)
          }

          setIsLocating(false)
        },
        () => {
          setIsLocating(false)
          alert("Não foi possível obter sua localização. Verifique as permissões do navegador.")
        }
      )
    }
  }

  const filteredInstructors = mockInstructors.filter(
    (instructor) =>
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <section id="mapa" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Encontre instrutores perto de você
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Instrutores na sua região
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Use o mapa interativo para encontrar os melhores instrutores próximos da sua localização.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar com busca e lista */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou especialidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGetLocation}
                disabled={isLocating}
                title="Usar minha localização"
              >
                <Navigation className={`w-4 h-4 ${isLocating ? "animate-pulse" : ""}`} />
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredInstructors.map((instructor) => (
                <Card
                  key={instructor.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedInstructor?.id === instructor.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedInstructor(instructor)
                    if (mapInstance) {
                      mapInstance.setView([instructor.lat, instructor.lng], 15)
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <img
                      src={instructor.photo}
                      alt={instructor.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate">{instructor.name}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {instructor.distance}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{instructor.rating}</span>
                        <span className="text-xs text-muted-foreground">({instructor.reviews})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {instructor.specialties.slice(0, 2).map((specialty) => (
                          <span
                            key={specialty}
                            className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border">
              <div ref={mapRef} className="w-full h-[500px]" />

              {/* Card do instrutor selecionado */}
              {selectedInstructor && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000]">
                  <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-xl">
                    <button
                      onClick={() => setSelectedInstructor(null)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex gap-4">
                      <img
                        src={selectedInstructor.photo}
                        alt={selectedInstructor.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">{selectedInstructor.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{selectedInstructor.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({selectedInstructor.reviews} avaliações)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedInstructor.distance} de você
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedInstructor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 gap-2" size="sm">
                        <Car className="w-4 h-4" />
                        Agendar aula
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Phone className="w-4 h-4" />
                        Ligar
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {userLocation && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Mostrando instrutores próximos à sua localização atual
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
