#!/usr/bin/env python3
"""
Threat Model for TA-Workspace Application

This threat model covers the trading analytics workspace application which includes:
- SvelteKit frontend (sv-appshell)
- Go backend API server (ta-server)
- Firebase services for authentication and data storage
- Exchange and watchlist services
"""

from pytm import TM, Server, Datastore, Dataflow, Boundary, Actor, ExternalEntity

# Initialize the threat model
tm = TM("TA-Workspace Threat Model")
tm.description = "Trading Analytics Workspace - A financial data dashboard application"
tm.isOrdered = True
tm.mergeResponses = True

# Define trust boundaries
internet = Boundary("Internet")
dmz = Boundary("DMZ")
internal = Boundary("Internal Network")
cloud = Boundary("Cloud Services")

# Actors
user = Actor("User")
user.inBoundary = internet
user.description = "End user accessing the trading dashboard"

# External entities
external_exchange_api = ExternalEntity("Exchange API")
external_exchange_api.inBoundary = internet
external_exchange_api.description = "External financial exchange data providers"

# Frontend
web_frontend = Server("SvelteKit Frontend")
web_frontend.inBoundary = dmz
web_frontend.description = "SvelteKit web application serving the dashboard UI"
web_frontend.OS = "Linux"
web_frontend.isHardened = True
web_frontend.protocol = "HTTPS"
web_frontend.implementsAuthenticationScheme = True
web_frontend.sanitizesInput = True
web_frontend.encodesOutput = True

# Backend API Server
api_server = Server("Go API Server")
api_server.inBoundary = internal
api_server.description = "Go backend server handling exchange and watchlist APIs"
api_server.OS = "Linux"
api_server.isHardened = True
api_server.protocol = "HTTPS"
api_server.implementsAuthenticationScheme = True
api_server.authorizesSource = True
api_server.sanitizesInput = True
api_server.encodesOutput = True
api_server.validatesInput = True

# Firebase Services
firebase_auth = ExternalEntity("Firebase Auth")
firebase_auth.inBoundary = cloud
firebase_auth.description = "Firebase Authentication service"

firebase_db = Datastore("Firebase Firestore")
firebase_db.inBoundary = cloud
firebase_db.description = "Firebase Firestore database for user data and watchlists"
firebase_db.isEncrypted = True
firebase_db.isSQL = False
firebase_db.storesLogData = False
firebase_db.storesPII = True
firebase_db.storesSensitiveData = True

# Data flows
user_to_frontend = Dataflow(user, web_frontend, "User Request")
user_to_frontend.protocol = "HTTPS"
user_to_frontend.isEncrypted = True
user_to_frontend.authenticatedWith = True
user_to_frontend.description = "User accesses the web dashboard"

frontend_to_api = Dataflow(web_frontend, api_server, "API Request")
frontend_to_api.protocol = "HTTPS"
frontend_to_api.isEncrypted = True
frontend_to_api.authenticatedWith = True
frontend_to_api.description = "Frontend makes API calls to backend"

api_to_firebase_auth = Dataflow(api_server, firebase_auth, "Auth Verification")
api_to_firebase_auth.protocol = "HTTPS"
api_to_firebase_auth.isEncrypted = True
api_to_firebase_auth.description = "Backend verifies user authentication tokens"

api_to_firebase_db = Dataflow(api_server, firebase_db, "Data Operations")
api_to_firebase_db.protocol = "HTTPS"
api_to_firebase_db.isEncrypted = True
api_to_firebase_db.description = "Backend reads/writes user data and watchlists"

api_to_exchange = Dataflow(api_server, external_exchange_api, "Market Data Request")
api_to_exchange.protocol = "HTTPS"
api_to_exchange.isEncrypted = True
api_to_exchange.description = "Backend fetches market data from exchange APIs"

frontend_response = Dataflow(web_frontend, user, "Dashboard Response")
frontend_response.protocol = "HTTPS"
frontend_response.isEncrypted = True
frontend_response.description = "Frontend serves dashboard content to user"

api_response = Dataflow(api_server, web_frontend, "API Response")
api_response.protocol = "HTTPS"
api_response.isEncrypted = True
api_response.description = "Backend returns data to frontend"

firebase_auth_response = Dataflow(firebase_auth, api_server, "Auth Token")
firebase_auth_response.protocol = "HTTPS"
firebase_auth_response.isEncrypted = True
firebase_auth_response.description = "Firebase returns authentication status"

firebase_db_response = Dataflow(firebase_db, api_server, "Data Response")
firebase_db_response.protocol = "HTTPS"
firebase_db_response.isEncrypted = True
firebase_db_response.description = "Firebase returns requested data"

exchange_response = Dataflow(external_exchange_api, api_server, "Market Data")
exchange_response.protocol = "HTTPS"
exchange_response.isEncrypted = True
exchange_response.description = "Exchange API returns market data"


if __name__ == "__main__":
    tm.process()
