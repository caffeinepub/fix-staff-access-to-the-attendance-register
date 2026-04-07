// Migration module: explicitly drops stable variables from the previous canister version
// that were owned by caffeineai-authorization (accessControlState) and
// caffeineai-user-approval (approvalState) packages which are no longer used.
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Exact types from the removed packages — required to avoid M0216 data-loss error.
  // caffeineai-authorization stored UserRole as this variant (confirmed by M0170 error).
  type UserRole = { #admin; #guest; #user };

  // caffeineai-user-approval stored ApprovalStatus as this variant.
  type ApprovalStatus = { #pending; #approved; #rejected };

  // Old actor stable state shape — consume the two orphaned variables and drop them.
  // Fields must match the exact previous serialised types to satisfy M0216.
  type OldActor = {
    accessControlState : { var adminAssigned : Bool; userRoles : Map.Map<Principal, UserRole> };
    approvalState : { var approvalStatus : Map.Map<Principal, ApprovalStatus> };
  };

  // New actor has no stable variables (uses enhanced orthogonal persistence).
  type NewActor = {};

  public func run(_ : OldActor) : NewActor {
    {};
  };
};
