-- Armazena quais categorias o instrutor possui veículo próprio
-- Ex: ['A', 'B'] — instrutor tem moto e carro

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS owned_vehicle_categories TEXT[] DEFAULT '{}';
