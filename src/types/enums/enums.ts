export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum BookingType {
  HOTEL = "hotel",
  CAR_RENTAL = "car_rental",
  TOUR = "tour",
  TRANSPORT = "transport",
}

export enum TransportType {
  BUS = "bus",
  TRAIN = "train",
}
export enum CarType {
  SEDAN = "sedan",
  SUV = "suv",
  HATCHBACK = "hatchback",
  LUXURY = "luxury",
}

export enum RoomType {
  SINGLE = "single",
  DOUBLE = "double",
  SUITE = "suite",
  DELUXE = "deluxe",
}
export enum TransportClass {
  SLEEPER = "sleeper",
  AC = "ac",
  NON_AC = "non_ac",
  SEATER = "seater",
}
