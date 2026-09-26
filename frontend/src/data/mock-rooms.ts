export interface Room {
  id: string
  name: string
  type: string
  price: number
  capacity: number
  amenities: string[]
  available: boolean
  thumbnail: string
  description: string
}

export const mockRooms: Room[] = [
  {
    id: 'RM-201',
    name: 'Oceanview Suite',
    type: 'Suite',
    price: 8500,
    capacity: 2,
    amenities: ['Sea View', 'Balcony', 'King Bed', 'Minibar', 'Bathtub'],
    available: true,
    thumbnail: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Luxurious suite offering panoramic views of the ocean.',
  },
  {
    id: 'RM-105',
    name: 'Deluxe Garden Room',
    type: 'Deluxe',
    price: 4500,
    capacity: 3,
    amenities: ['Garden View', 'Queen Bed', 'Patio', 'Free WiFi'],
    available: true,
    thumbnail: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Spacious room with direct access to our tropical gardens.',
  },
  {
    id: 'RM-304',
    name: 'Family Connected',
    type: 'Family',
    price: 7200,
    capacity: 4,
    amenities: ['2 Bedrooms', 'City View', 'Kitchenette', 'Living Area'],
    available: false,
    thumbnail: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Perfect for families, featuring interconnected rooms.',
  },
  {
    id: 'RM-112',
    name: 'Standard AC',
    type: 'Standard',
    price: 2500,
    capacity: 2,
    amenities: ['AC', 'Double Bed', 'TV', 'Ensuite Bathroom'],
    available: true,
    thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Comfortable and affordable stay for budget travelers.',
  }
]
