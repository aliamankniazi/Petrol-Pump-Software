import { ConnectorConfig } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface FillUp_Key {
  id: UUIDString;
  __typename?: 'FillUp_Key';
}

export interface FuelPrice_Key {
  id: UUIDString;
  __typename?: 'FuelPrice_Key';
}

export interface MaintenanceReminder_Key {
  id: UUIDString;
  __typename?: 'MaintenanceReminder_Key';
}

export interface PetrolStation_Key {
  id: UUIDString;
  __typename?: 'PetrolStation_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Vehicle_Key {
  id: UUIDString;
  __typename?: 'Vehicle_Key';
}

