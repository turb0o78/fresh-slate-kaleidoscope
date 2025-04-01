/*
  # Create Payments Table

  1. New Table
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (text)
      - `quantity` (integer, default: 1)
      - `total_amount` (decimal)
      - `status` (text, default: 'pending')
      - `stripe_session_id` (text)
      - `stripe_payment_intent_id` (text)
      - `is_paid` (boolean, default: false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users to view their own payments
*/

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE payments IS 'Stores payment records for all transactions';
COMMENT ON COLUMN payments.product_id IS 'Identifier for the product or service being purchased';
COMMENT ON COLUMN payments.total_amount IS 'Total amount of the payment in decimal format';
COMMENT ON COLUMN payments.status IS 'Current status of the payment (pending, processing, completed, failed, refunded)';
COMMENT ON COLUMN payments.stripe_session_id IS 'Stripe Checkout Session ID if payment is processed through Stripe';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID for tracking payment status';
COMMENT ON COLUMN payments.is_paid IS 'Boolean flag indicating if payment has been successfully processed';