export interface Transaction {
    id:               string;
    status:           string;
    created_at:       Date;
    email:            string;
    full_name:        string;
    amount:           number;
    order:            string;
    subject:          string;
    payment:          Payment;
    gateway_response: GatewayResponse;
}

export interface GatewayResponse {
    status:  string;
    message: string;
}

export interface Payment {
    start:                 Date;
    end:                   Date;
    media:                 string;
    transaction_id:        string;
    payment_key:           string;
    transaction_key:       null;
    deposit_date:          Date;
    verification_key:      string;
    authorization_code:    string;
    last_4_digits:         string;
    installments:          number;
    card_type:             string;
    additional_parameters: AdditionalParameters;
    currency:              string;
}

export interface AdditionalParameters {
    direccion: string;
}