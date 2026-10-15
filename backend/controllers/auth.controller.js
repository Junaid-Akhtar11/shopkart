/**
 * Auth Controller (Alias/wrapper for Customer Authentication controller)
 */
export * from "./customer.controller.js";
export {
  registerCustomer as registerUser,
  loginCustomer as loginUser,
  getCurrentCustomer as getCurrentUser,
  logoutCustomer as logoutUser,
} from "./customer.controller.js";
