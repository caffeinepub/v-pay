import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface User {
    name: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserRole(): Promise<UserRole>;
    getUser(phone: string): Promise<User>;
    isCallerAdmin(): Promise<boolean>;
    register(phone: string, name: string): Promise<void>;
}
