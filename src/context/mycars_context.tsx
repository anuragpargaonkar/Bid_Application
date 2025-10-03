import React, { createContext, useContext, useState, ReactNode } from "react";
 
// Define Car type
export type Car = {
  id: string;
  name: string;
  price: number;
  imageSource: any;
  subtitle?: string;
  info?: string;
  time?: string;
  isScrap?: boolean;
};
 
// Context type
type MyCarsContextType = {
  myCars: Car[];
  addCar: (car: Car) => void;
};
 
const MyCarsContext = createContext<MyCarsContextType>({
  myCars: [],
  addCar: () => {},
});
 
// Provider component
export const MyCarsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [myCars, setMyCars] = useState<Car[]>([]);
 
  // Add car if it doesn't already exist
  const addCar = (car: Car) => {
    setMyCars((prev) => {
      if (prev.find((c) => c.id === car.id)) return prev; // avoid duplicates
      return [...prev, car];
    });
  };
 
  return (
    <MyCarsContext.Provider value={{ myCars, addCar }}>
      {children}
    </MyCarsContext.Provider>
  );
};
 
// Hook to use the context
export const useMyCars = () => useContext(MyCarsContext);
 
 