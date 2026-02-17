@res @realtime
Feature: resClient Integration
  As a module developer, I want to be able to expose a resClient in my module bundle
  so that the system or other modules can use it to subscribe to real-time data from resgate.

  Scenario: Registry preserves resClient during registration
    Given a module initialization function
    When it returns an IModuleBundle containing a resClient
    Then the Registry should store the bundle including the resClient

  Scenario: Consumers can access resClient from registered modules
    Given a registered module with a resClient
    When a consumer requests the module from the Registry
    Then it should be able to access the resClient

  Scenario: Fallback to non-RES connection when resClient is null
    Given a module bundle with resClient set to null
    When a component attempts to use real-time synchronization
    Then it should fallback to standard API connections (e.g. REST/Zodios)

  Scenario: Widgets access resClient from module bundle
    Given a widget is part of a module bundle
    When it attempts to access the resClient field of the IModuleBundle
    Then it should receive the initialized client if present
