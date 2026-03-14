import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.name, user2.name);
    };
  };

  public type User = {
    name : Text;
    phone : Text;
  };

  let users = Map.empty<Text, User>();
  let principalToPhone = Map.empty<Principal, Text>();

  public shared ({ caller }) func register(phone : Text, name : Text) : async () {
    let user : User = {
      name;
      phone;
    };
    users.add(phone, user);
    principalToPhone.add(caller, phone);
  };

  public query ({ caller }) func getUser(phone : Text) : async User {
    users.get(phone).unwrap();
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    users.values().toArray().sort();
  };
};
