"""
Formatters for Brazilian documents and legal identifiers.
Returns formatted strings for display purposes.
"""
import re


def format_cpf(cpf):
    """
    Formats CPF: '12345678901' → '123.456.789-01'
    """
    if not cpf:
        return ''
    
    # Remove any non-digit characters
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    if len(cpf) != 11:
        return cpf  # Return as-is if invalid length
    
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:11]}"


def format_cnpj(cnpj):
    """
    Formats CNPJ: '12345678000199' → '12.345.678/0001-99'
    """
    if not cnpj:
        return ''
    
    # Remove any non-digit characters
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    if len(cnpj) != 14:
        return cnpj  # Return as-is if invalid length
    
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}"


def format_document(document, person_type):
    """
    Formats document based on person type.
    person_type: 'PF' for CPF or 'PJ' for CNPJ
    """
    if person_type == 'PF':
        return format_cpf(document)
    elif person_type == 'PJ':
        return format_cnpj(document)
    return document


def format_processo_cnj(processo):
    """
    Formats legal process number: '00001234520248160000' → '0000123-45.2024.8.16.0000'
    """
    if not processo:
        return ''
    
    # Remove any non-digit characters
    processo = re.sub(r'[^0-9]', '', processo)
    
    if len(processo) != 20:
        return processo  # Return as-is if invalid length
    
    return f"{processo[:7]}-{processo[7:9]}.{processo[9:13]}.{processo[13]}.{processo[14:16]}.{processo[16:20]}"


def format_phone(phone):
    """
    Formats Brazilian phone numbers:
    '1199999999' → '(11) 9999-9999' (8 digits)
    '11999999999' → '(11) 99999-9999' (9 digits - mobile)
    """
    if not phone:
        return ''
    
    # Remove any non-digit characters
    phone = re.sub(r'[^0-9]', '', phone)
    
    if len(phone) == 10:
        # Landline: (11) 9999-9999
        return f"({phone[:2]}) {phone[2:6]}-{phone[6:10]}"
    elif len(phone) == 11:
        # Mobile: (11) 99999-9999
        return f"({phone[:2]}) {phone[2:7]}-{phone[7:11]}"
    
    return phone  # Return as-is if unexpected format


def format_cep(cep):
    """
    Formats Brazilian ZIP code: '01310100' → '01310-100'
    """
    if not cep:
        return ''
    
    # Remove any non-digit characters
    cep = re.sub(r'[^0-9]', '', cep)
    
    if len(cep) != 8:
        return cep  # Return as-is if invalid length
    
    return f"{cep[:5]}-{cep[5:8]}"


def clean_digits(value):
    """
    Removes all non-digit characters from string.
    Useful for storing unformatted values in database.
    """
    if not value:
        return ''
    return re.sub(r'[^0-9]', '', value)
