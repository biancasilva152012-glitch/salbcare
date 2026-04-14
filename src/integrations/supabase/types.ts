export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounting_partners: {
        Row: {
          company_name: string
          created_at: string
          id: string
          monthly_price: number
          rating: number
          reviews_count: number
          specialty: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          monthly_price: number
          rating?: number
          reviews_count?: number
          specialty?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          monthly_price?: number
          rating?: number
          reviews_count?: number
          specialty?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      ambassador_applications: {
        Row: {
          conversions: number
          coupon_code: string | null
          created_at: string
          email: string
          free_months_earned: number
          id: string
          motivation: string | null
          name: string
          phone: string | null
          social_media: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversions?: number
          coupon_code?: string | null
          created_at?: string
          email: string
          free_months_earned?: number
          id?: string
          motivation?: string | null
          name: string
          phone?: string | null
          social_media?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversions?: number
          coupon_code?: string | null
          created_at?: string
          email?: string
          free_months_earned?: number
          id?: string
          motivation?: string | null
          name?: string
          phone?: string | null
          social_media?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ambassador_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: string
          created_at: string
          date: string
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          professional_id: string | null
          receipt_url: string | null
          status: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type?: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          professional_id?: string | null
          receipt_url?: string | null
          status?: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          professional_id?: string | null
          receipt_url?: string | null
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_prospects: {
        Row: {
          assigned_to: string | null
          city: string | null
          cnpj: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          next_action_date: string | null
          notes: string | null
          partner_type: string
          phone: string | null
          pipeline_stage: string
          state: string | null
          updated_at: string
          whatsapp_link: string | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          cnpj?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          next_action_date?: string | null
          notes?: string | null
          partner_type?: string
          phone?: string | null
          pipeline_stage?: string
          state?: string | null
          updated_at?: string
          whatsapp_link?: string | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          next_action_date?: string | null
          notes?: string | null
          partner_type?: string
          phone?: string | null
          pipeline_stage?: string
          state?: string | null
          updated_at?: string
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      cnpj_requests: {
        Row: {
          city: string
          cpf: string
          created_at: string
          documents: string | null
          id: string
          name: string
          profession: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          cpf: string
          created_at?: string
          documents?: string | null
          id?: string
          name: string
          profession: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          cpf?: string
          created_at?: string
          documents?: string | null
          id?: string
          name?: string
          profession?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultation_payments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string
          gross_amount: number
          id: string
          net_amount: number
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          payment_method: string
          platform_fee: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id: string
          gross_amount: number
          id?: string
          net_amount: number
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_method?: string
          platform_fee: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_method?: string
          platform_fee?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diagnosticos: {
        Row: {
          aceita_dicas: boolean
          converteu_para_trial: boolean
          created_at: string
          email: string
          especialidade: string
          faturamento: string
          id: string
          nome: string
          regime_atual: string
          resultado_gerado: Json
          whatsapp: string
        }
        Insert: {
          aceita_dicas?: boolean
          converteu_para_trial?: boolean
          created_at?: string
          email: string
          especialidade: string
          faturamento: string
          id?: string
          nome: string
          regime_atual: string
          resultado_gerado?: Json
          whatsapp: string
        }
        Update: {
          aceita_dicas?: boolean
          converteu_para_trial?: boolean
          created_at?: string
          email?: string
          especialidade?: string
          faturamento?: string
          id?: string
          nome?: string
          regime_atual?: string
          resultado_gerado?: Json
          whatsapp?: string
        }
        Relationships: []
      }
      digital_documents: {
        Row: {
          council_number: string | null
          council_state: string | null
          created_at: string
          document_type: string
          file_path: string | null
          hash_code: string
          id: string
          metadata: Json | null
          patient_id: string | null
          patient_name: string
          professional_name: string
          professional_type: string
          signed_icp: boolean
          user_id: string
        }
        Insert: {
          council_number?: string | null
          council_state?: string | null
          created_at?: string
          document_type?: string
          file_path?: string | null
          hash_code: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          patient_name: string
          professional_name: string
          professional_type?: string
          signed_icp?: boolean
          user_id: string
        }
        Update: {
          council_number?: string | null
          council_state?: string | null
          created_at?: string
          document_type?: string
          file_path?: string | null
          hash_code?: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          patient_name?: string
          professional_name?: string
          professional_type?: string
          signed_icp?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_requests: {
        Row: {
          created_at: string
          exam_type: string
          id: string
          lab_name: string
          notes: string | null
          preferred_date: string
          preferred_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_type: string
          id?: string
          lab_name: string
          notes?: string | null
          preferred_date: string
          preferred_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_type?: string
          id?: string
          lab_name?: string
          notes?: string | null
          preferred_date?: string
          preferred_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          amount: number
          cpf_cnpj: string | null
          created_at: string
          date: string
          id: string
          iss_rate: number | null
          patient_name: string
          payment_method: string
          service: string
          service_code: string | null
          status: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          amount: number
          cpf_cnpj?: string | null
          created_at?: string
          date?: string
          id?: string
          iss_rate?: number | null
          patient_name: string
          payment_method?: string
          service: string
          service_code?: string | null
          status?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          amount?: number
          cpf_cnpj?: string | null
          created_at?: string
          date?: string
          id?: string
          iss_rate?: number | null
          patient_name?: string
          payment_method?: string
          service?: string
          service_code?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      lawyers: {
        Row: {
          consultation_price: number
          created_at: string
          id: string
          name: string
          rating: number
          reviews_count: number
          specialty: string
        }
        Insert: {
          consultation_price: number
          created_at?: string
          id?: string
          name: string
          rating?: number
          reviews_count?: number
          specialty: string
        }
        Update: {
          consultation_price?: number
          created_at?: string
          id?: string
          name?: string
          rating?: number
          reviews_count?: number
          specialty?: string
        }
        Relationships: []
      }
      leads_b2b: {
        Row: {
          cidade: string
          cnpj: string | null
          created_at: string
          email: string
          estado: string | null
          id: string
          nome_empresa: string
          nome_responsavel: string
          quantidade_unidades: string
          status: string
          tipo: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          cidade: string
          cnpj?: string | null
          created_at?: string
          email: string
          estado?: string | null
          id?: string
          nome_empresa: string
          nome_responsavel: string
          quantidade_unidades?: string
          status?: string
          tipo?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          cidade?: string
          cnpj?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          id?: string
          nome_empresa?: string
          nome_responsavel?: string
          quantidade_unidades?: string
          status?: string
          tipo?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      legal_consultations: {
        Row: {
          created_at: string
          date: string
          id: string
          lawyer_id: string
          notes: string | null
          status: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          lawyer_id: string
          notes?: string | null
          status?: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          lawyer_id?: string
          notes?: string | null
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_consultations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string | null
          certificate: string | null
          chief_complaint: string | null
          consultation_date: string
          created_at: string
          current_medications: string | null
          diagnosis: string | null
          family_history: string | null
          follow_up_notes: string | null
          history_present_illness: string | null
          icd_code: string | null
          id: string
          past_medical_history: string | null
          patient_id: string | null
          patient_name: string
          physical_exam: string | null
          prescription: string | null
          social_history: string | null
          teleconsultation_id: string | null
          treatment_plan: string | null
          updated_at: string
          user_id: string
          vital_signs: Json | null
        }
        Insert: {
          allergies?: string | null
          certificate?: string | null
          chief_complaint?: string | null
          consultation_date?: string
          created_at?: string
          current_medications?: string | null
          diagnosis?: string | null
          family_history?: string | null
          follow_up_notes?: string | null
          history_present_illness?: string | null
          icd_code?: string | null
          id?: string
          past_medical_history?: string | null
          patient_id?: string | null
          patient_name: string
          physical_exam?: string | null
          prescription?: string | null
          social_history?: string | null
          teleconsultation_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
          user_id: string
          vital_signs?: Json | null
        }
        Update: {
          allergies?: string | null
          certificate?: string | null
          chief_complaint?: string | null
          consultation_date?: string
          created_at?: string
          current_medications?: string | null
          diagnosis?: string | null
          family_history?: string | null
          follow_up_notes?: string | null
          history_present_illness?: string | null
          icd_code?: string | null
          id?: string
          past_medical_history?: string | null
          patient_id?: string | null
          patient_name?: string
          physical_exam?: string | null
          prescription?: string | null
          social_history?: string | null
          teleconsultation_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
          user_id?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_teleconsultation_id_fkey"
            columns: ["teleconsultation_id"]
            isOneToOne: false
            referencedRelation: "teleconsultations"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          professional_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          professional_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          professional_id?: string
          role?: string
        }
        Relationships: []
      }
      partner_hires: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_hires_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "accounting_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_interests: {
        Row: {
          city: string
          cnpj: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          partner_type: string
          phone: string | null
          plan_interest: string | null
        }
        Insert: {
          city: string
          cnpj?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          partner_type?: string
          phone?: string | null
          plan_interest?: string | null
        }
        Update: {
          city?: string
          cnpj?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          partner_type?: string
          phone?: string | null
          plan_interest?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          patient_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_type?: string
          id?: string
          patient_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          patient_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          initial_anamnesis: string | null
          medical_history: string | null
          name: string
          notes: string | null
          phone: string | null
          procedure_performed: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initial_anamnesis?: string | null
          medical_history?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          procedure_performed?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initial_anamnesis?: string | null
          medical_history?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          procedure_performed?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          avatar_url: string | null
          billing: string | null
          created_at: string
          crm: string | null
          email: string | null
          had_trial: boolean | null
          id: string
          meet_link: string | null
          name: string
          phone: string | null
          plan: string | null
          plan_updated_at: string | null
          signature_url: string | null
          specialty: string
          stamp_url: string | null
          status: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          billing?: string | null
          created_at?: string
          crm?: string | null
          email?: string | null
          had_trial?: boolean | null
          id?: string
          meet_link?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          plan_updated_at?: string | null
          signature_url?: string | null
          specialty?: string
          stamp_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          billing?: string | null
          created_at?: string
          crm?: string | null
          email?: string | null
          had_trial?: boolean | null
          id?: string
          meet_link?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          plan_updated_at?: string | null
          signature_url?: string | null
          specialty?: string
          stamp_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acquisition_source: string | null
          availability_online: boolean
          available_hours: Json | null
          avatar_url: string | null
          bio: string | null
          card_link: string | null
          consultation_price: number | null
          council_document_path: string | null
          council_number: string | null
          council_state: string | null
          created_at: string
          crm: string | null
          email: string
          id: string
          interval_minutes: number
          meet_link: string | null
          min_advance_hours: number
          name: string
          office_address: string | null
          payment_status: string
          phone: string | null
          pix_key: string | null
          plan: string
          professional_type: string
          profile_slug: string | null
          referral_code: string | null
          slot_duration: number | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          suspended_until: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          user_type: string
          verification_status: string
        }
        Insert: {
          acquisition_source?: string | null
          availability_online?: boolean
          available_hours?: Json | null
          avatar_url?: string | null
          bio?: string | null
          card_link?: string | null
          consultation_price?: number | null
          council_document_path?: string | null
          council_number?: string | null
          council_state?: string | null
          created_at?: string
          crm?: string | null
          email: string
          id?: string
          interval_minutes?: number
          meet_link?: string | null
          min_advance_hours?: number
          name: string
          office_address?: string | null
          payment_status?: string
          phone?: string | null
          pix_key?: string | null
          plan?: string
          professional_type?: string
          profile_slug?: string | null
          referral_code?: string | null
          slot_duration?: number | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suspended_until?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          verification_status?: string
        }
        Update: {
          acquisition_source?: string | null
          availability_online?: boolean
          available_hours?: Json | null
          avatar_url?: string | null
          bio?: string | null
          card_link?: string | null
          consultation_price?: number | null
          council_document_path?: string | null
          council_number?: string | null
          council_state?: string | null
          created_at?: string
          crm?: string | null
          email?: string
          id?: string
          interval_minutes?: number
          meet_link?: string | null
          min_advance_hours?: number
          name?: string
          office_address?: string | null
          payment_status?: string
          phone?: string | null
          pix_key?: string | null
          plan?: string
          professional_type?: string
          profile_slug?: string | null
          referral_code?: string | null
          slot_duration?: number | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suspended_until?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          verification_status?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          consultation_price: number | null
          created_at: string
          id: string
          notes: string | null
          patient_address: string | null
          patient_birth_date: string | null
          patient_cpf: string | null
          patient_data: Json | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          payment_status: string
          prescription_data: Json | null
          prescription_image_path: string | null
          professional_id: string
          receipt_url: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          consultation_price?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_address?: string | null
          patient_birth_date?: string | null
          patient_cpf?: string | null
          patient_data?: Json | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string
          prescription_data?: Json | null
          prescription_image_path?: string | null
          professional_id: string
          receipt_url?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          consultation_price?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_address?: string | null
          patient_birth_date?: string | null
          patient_cpf?: string | null
          patient_data?: Json | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string
          prescription_data?: Json | null
          prescription_image_path?: string | null
          professional_id?: string
          receipt_url?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      teleconsultations: {
        Row: {
          created_at: string
          date: string
          duration: number | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          room_name: string | null
          room_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          room_name?: string | null
          room_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          room_name?: string | null
          room_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_apply_suspension: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_email_user_type: { Args: { check_email: string }; Returns: string }
      get_ambassador_spots_taken: { Args: never; Returns: number }
      get_public_professionals: {
        Args: { specialty_filter?: string }
        Returns: {
          available_hours: Json
          avatar_url: string
          bio: string
          card_link: string
          consultation_price: number
          council_number: string
          council_state: string
          crm: string
          interval_minutes: number
          meet_link: string
          min_advance_hours: number
          name: string
          phone: string
          pix_key: string
          professional_type: string
          slot_duration: number
          user_id: string
        }[]
      }
      get_public_profile_by_slug: {
        Args: { _slug: string }
        Returns: {
          bio: string
          council_number: string
          council_state: string
          email: string
          name: string
          phone: string
          professional_type: string
          profile_slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_contador: { Args: { _user_id: string }; Returns: boolean }
      verify_document_by_hash: {
        Args: { _hash: string }
        Returns: {
          council_number: string
          council_state: string
          created_at: string
          document_type: string
          patient_name: string
          professional_name: string
          professional_type: string
          signed_icp: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "contador" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contador", "user"],
    },
  },
} as const
