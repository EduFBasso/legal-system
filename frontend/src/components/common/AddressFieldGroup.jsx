// src/components/common/AddressFieldGroup.jsx
/**
 * @fileoverview Grupo de campos de endereço
 * Encapsula os 7 campos de endereço em um componente reutilizável
 * 
 * @example
 * <AddressFieldGroup
 *   address={{
 *     zip_code: '01310-100',
 *     address_line1: 'Av. Paulista',
 *     address_number: '1578',
 *     complement: 'Sala 10',
 *     neighborhood: 'Bela Vista',
 *     city: 'São Paulo',
 *     state: 'SP'
 *   }}
 *   onChange={(field, value) => handleChange(field, value)}
 *   readOnly={!isEditing}
 * />
 */

import FormField from './FormField';
import FormMaskedField from './FormMaskedField';
import { maskCEP } from '../../utils/masks';
import './AddressFieldGroup.css';

/**
 * AddressFieldGroup - Grupo de campos de endereço
 * @param {Object} props
 * @param {Object} props.address - Objeto com campos de endereço
 * @param {string} [props.address.zip_code] - CEP
 * @param {string} [props.address.address_line1] - Logradouro (rua, av)
 * @param {string} [props.address.address_number] - Número
 * @param {string} [props.address.complement] - Complemento
 * @param {string} [props.address.neighborhood] - Bairro
 * @param {string} [props.address.city] - Cidade
 * @param {string} [props.address.state] - UF (2 letras)
 * @param {function} props.onChange - Callback: (fieldName, value) => void
 * @param {boolean} [props.readOnly=false] - Se true, exibe em modo leitura
 * @param {string} [props.className=''] - Classes CSS adicionais
 */
export default function AddressFieldGroup({
  address = {},
  onChange,
  readOnly = false,
  className = '',
}) {
  const {
    zip_code = '',
    address_line1 = '',
    address_number = '',
    complement = '',
    neighborhood = '',
    city = '',
    state = '',
  } = address;

  return (
    <div className={`address-field-group ${className}`}>
      <div className="address-grid">
        <FormMaskedField
          label="CEP"
          value={zip_code}
          onChange={(value) => onChange('zip_code', value)}
          mask={maskCEP}
          readOnly={readOnly}
          placeholder="00000-000"
          maxLength={9}
          className="address-field-cep"
        />
        
        <FormField
          label="Logradouro"
          value={address_line1}
          onChange={(value) => onChange('address_line1', value)}
          readOnly={readOnly}
          placeholder="Rua, Avenida..."
          className="address-field-street"
        />
        
        <FormField
          label="Número"
          value={address_number}
          onChange={(value) => onChange('address_number', value)}
          readOnly={readOnly}
          placeholder="123"
          className="address-field-number"
        />
        
        <FormField
          label="Complemento"
          value={complement}
          onChange={(value) => onChange('complement', value)}
          readOnly={readOnly}
          placeholder="Apto, Sala..."
          className="address-field-complement"
        />
        
        <FormField
          label="Bairro"
          value={neighborhood}
          onChange={(value) => onChange('neighborhood', value)}
          readOnly={readOnly}
          placeholder="Bairro"
          className="address-field-neighborhood"
        />
        
        <FormField
          label="Cidade"
          value={city}
          onChange={(value) => onChange('city', value)}
          readOnly={readOnly}
          placeholder="São Paulo"
          className="address-field-city"
        />
        
        <FormField
          label="Estado"
          value={state}
          onChange={(value) => onChange('state', value.toUpperCase())}
          readOnly={readOnly}
          placeholder="SP"
          maxLength={2}
          className="address-field-state"
        />
      </div>
    </div>
  );
}
