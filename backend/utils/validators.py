"""
Validators for Brazilian documents and legal identifiers.
"""
import re
from django.core.exceptions import ValidationError


def validate_cpf(value):
    """
    Validates Brazilian CPF (Cadastro de Pessoas Físicas).
    Accepts: '12345678901' or '123.456.789-01'
    """
    if not value:
        return
    
    # Remove formatting
    cpf = re.sub(r'[^0-9]', '', value)
    
    # Check length
    if len(cpf) != 11:
        raise ValidationError('CPF deve conter 11 dígitos.')
    
    # Check if all digits are the same (invalid CPF)
    if cpf == cpf[0] * 11:
        raise ValidationError('CPF inválido.')
    
    # Validate check digits
    def calculate_digit(cpf_partial):
        total = sum(int(digit) * weight for digit, weight in zip(cpf_partial, range(len(cpf_partial) + 1, 1, -1)))
        remainder = total % 11
        return 0 if remainder < 2 else 11 - remainder
    
    # First digit
    if int(cpf[9]) != calculate_digit(cpf[:9]):
        raise ValidationError('CPF inválido.')
    
    # Second digit
    if int(cpf[10]) != calculate_digit(cpf[:10]):
        raise ValidationError('CPF inválido.')


def validate_cnpj(value):
    """
    Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica).
    Accepts: '12345678000199' or '12.345.678/0001-99'
    """
    if not value:
        return
    
    # Remove formatting
    cnpj = re.sub(r'[^0-9]', '', value)
    
    # Check length
    if len(cnpj) != 14:
        raise ValidationError('CNPJ deve conter 14 dígitos.')
    
    # Check if all digits are the same (invalid CNPJ)
    if cnpj == cnpj[0] * 14:
        raise ValidationError('CNPJ inválido.')
    
    # Validate check digits
    def calculate_digit(cnpj_partial, weights):
        total = sum(int(digit) * weight for digit, weight in zip(cnpj_partial, weights))
        remainder = total % 11
        return 0 if remainder < 2 else 11 - remainder
    
    # First digit
    weights_first = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    if int(cnpj[12]) != calculate_digit(cnpj[:12], weights_first):
        raise ValidationError('CNPJ inválido.')
    
    # Second digit
    weights_second = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    if int(cnpj[13]) != calculate_digit(cnpj[:13], weights_second):
        raise ValidationError('CNPJ inválido.')


def validate_document(value, person_type):
    """
    Validates document based on person type.
    person_type: 'PF' for CPF or 'PJ' for CNPJ
    """
    if person_type == 'PF':
        validate_cpf(value)
    elif person_type == 'PJ':
        validate_cnpj(value)


def validate_processo_cnj(value):
    """
    Validates Brazilian legal process number (CNJ format).
    Format: NNNNNNN-DD.AAAA.J.TR.OOOO
    Example: 0000123-45.2024.8.16.0000
    
    Where:
    - NNNNNNN: Sequential number (7 digits)
    - DD: Verification digits (2 digits)
    - AAAA: Year (4 digits)
    - J: Judicial segment (1 digit): 1-STF, 2-CNJ, 3-STJ, etc.
    - TR: Court (2 digits): 01-TRF1, 08-TJ, 09-TRT, etc.
    - OOOO: Origin (4 digits)
    """
    if not value:
        return
    
    # Remove formatting
    processo = re.sub(r'[^0-9]', '', value)
    
    # Check length (20 digits total)
    if len(processo) != 20:
        raise ValidationError('Número do processo deve conter 20 dígitos.')
    
    # Validate format with regex (formatted version)
    pattern = r'^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$'
    formatted = f"{processo[:7]}-{processo[7:9]}.{processo[9:13]}.{processo[13]}.{processo[14:16]}.{processo[16:20]}"
    
    if not re.match(pattern, formatted):
        raise ValidationError('Formato de processo inválido. Use: NNNNNNN-DD.AAAA.J.TR.OOOO')
    
    # Validate check digits (módulo 97)
    # Origin (4) + Year (4) + Segment (1) + Court (2) + Sequential (7)
    check_string = processo[16:20] + processo[9:13] + processo[13] + processo[14:16] + processo[:7]
    remainder = int(check_string) % 97
    check_digits = 98 - remainder
    
    if int(processo[7:9]) != check_digits:
        raise ValidationError('Dígitos verificadores do processo inválidos.')
