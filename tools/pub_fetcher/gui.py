#!/usr/bin/env python3
"""
Publication Fetcher - GUI
Interface gráfica simples para buscar publicações do PJe Comunica.
"""

import json
import os
import subprocess
import sys
import webbrowser
from datetime import datetime
from pathlib import Path
from tkinter import *
from tkinter import ttk, messagebox, scrolledtext

import requests
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# Importar lógica do main.py
from main import fetch_publications, normalize_publications, save_to_json, OUTPUT_DIR


class PublicationFetcherGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Busca de Publicações Jurídicas - PJe Comunica")
        
        # Detectar tamanho da tela e ajustar janela (80% da altura, mínimo de 800x750)
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        
        # Janela adaptável: 850px largura, 85% da altura da tela (mínimo 750, máximo 950)
        window_width = 850
        window_height = max(750, min(950, int(screen_height * 0.85)))
        
        # Centralizar janela
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2
        
        self.root.geometry(f"{window_width}x{window_height}+{x}+{y}")
        self.root.resizable(True, True)  # Permitir redimensionar
        self.root.minsize(800, 700)  # Tamanho mínimo
        
        # Armazenar últimas publicações
        self.last_publications = []
        self.last_json_file = None
        self.last_pdf_file = None
        
        # Configurar estilo com fontes maiores para acessibilidade
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TLabel', font=('Segoe UI', 11))
        style.configure('TButton', font=('Segoe UI', 11), padding=10)
        style.configure('TRadiobutton', font=('Segoe UI', 11))
        
        self.create_widgets()
        
    def create_widgets(self):
        # Frame principal com grid responsivo
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(N, W, E, S))
        
        # Configurar grid para ser responsivo
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # Título
        title = ttk.Label(main_frame, text="Busca de Publicações Jurídicas", 
                         font=('Segoe UI', 18, 'bold'))
        title.grid(row=0, column=0, columnspan=3, pady=(0, 25))
        
        # Tipo de Busca (NOVO - facilita decisão)
        ttk.Label(main_frame, text="Buscar por:", font=('Segoe UI', 11, 'bold')).grid(
            row=1, column=0, sticky=W, pady=5)
        self.tipo_busca_var = StringVar(value="ambos")
        tipo_busca_combo = ttk.Combobox(main_frame, textvariable=self.tipo_busca_var,
                                       values=[
                                           "ambos - OAB + Nome (recomendado)",
                                           "oab - Apenas Número da OAB",
                                           "nome - Apenas Nome do Advogado"
                                       ],
                                       state="readonly", width=35, font=('Segoe UI', 11))
        tipo_busca_combo.grid(row=1, column=1, columnspan=2, sticky=W, pady=5)
        tipo_busca_combo.bind('<<ComboboxSelected>>', self.on_tipo_busca_changed)
        
        # Separator
        ttk.Separator(main_frame, orient=HORIZONTAL).grid(
            row=2, column=0, columnspan=3, sticky=(W, E), pady=15)
        
        # Tribunal
        ttk.Label(main_frame, text="Tribunal:", font=('Segoe UI', 11)).grid(
            row=3, column=0, sticky=W, pady=5)
        self.tribunal_var = StringVar(value="TJSP")
        tribunal_combo = ttk.Combobox(main_frame, textvariable=self.tribunal_var, 
                                     values=["TJSP", "TJRJ", "TJMG", "TJPR", "TJRS", 
                                             "TJSC", "TRF1", "TRF2", "TRF3", "TRF4", "TRF5"],
                                     state="readonly", width=30, font=('Segoe UI', 11))
        tribunal_combo.grid(row=3, column=1, columnspan=2, sticky=W, pady=5)
        
        # Número OAB
        self.oab_label = ttk.Label(main_frame, text="Número OAB:", font=('Segoe UI', 11))
        self.oab_label.grid(row=4, column=0, sticky=W, pady=5)
        self.oab_var = StringVar(value="507553")
        self.oab_entry = ttk.Entry(main_frame, textvariable=self.oab_var, width=32, font=('Segoe UI', 11))
        self.oab_entry.grid(row=4, column=1, columnspan=2, sticky=W, pady=5)
        
        # Nome do Advogado
        self.nome_label = ttk.Label(main_frame, text="Nome Advogado:", font=('Segoe UI', 11))
        self.nome_label.grid(row=5, column=0, sticky=W, pady=5)
        self.nome_var = StringVar(value="")
        self.nome_entry = ttk.Entry(main_frame, textvariable=self.nome_var, width=32, font=('Segoe UI', 11))
        self.nome_entry.grid(row=5, column=1, columnspan=2, sticky=W, pady=5)
        
        # Separator
        ttk.Separator(main_frame, orient=HORIZONTAL).grid(
            row=6, column=0, columnspan=3, sticky=(W, E), pady=15)
        
        # Período
        ttk.Label(main_frame, text="Período:", font=('Segoe UI', 11, 'bold')).grid(
            row=7, column=0, columnspan=3, sticky=W, pady=(0, 5))
        
        # Opção de hoje
        self.periodo_var = StringVar(value="hoje")
        hoje_radio = ttk.Radiobutton(main_frame, text="Publicações de hoje", 
                                     variable=self.periodo_var, value="hoje",
                                     command=self.toggle_date_fields)
        hoje_radio.grid(row=8, column=0, columnspan=3, sticky=W, pady=2)
        
        # Opção customizada
        custom_radio = ttk.Radiobutton(main_frame, text="Período customizado:", 
                                       variable=self.periodo_var, value="custom",
                                       command=self.toggle_date_fields)
        custom_radio.grid(row=9, column=0, columnspan=3, sticky=W, pady=2)
        
        # Data início
        date_frame = ttk.Frame(main_frame)
        date_frame.grid(row=10, column=0, columnspan=3, sticky=W, padx=(20, 0), pady=5)
        
        ttk.Label(date_frame, text="De:", font=('Segoe UI', 11)).grid(
            row=0, column=0, sticky=W, padx=(0, 5))
        self.data_inicio_var = StringVar(value=datetime.now().strftime('%Y-%m-%d'))
        self.data_inicio_entry = ttk.Entry(date_frame, textvariable=self.data_inicio_var, 
                                          width=14, state="disabled", font=('Segoe UI', 11))
        self.data_inicio_entry.grid(row=0, column=1, sticky=W, padx=(0, 15))
        
        ttk.Label(date_frame, text="Até:", font=('Segoe UI', 11)).grid(
            row=0, column=2, sticky=W, padx=(0, 5))
        self.data_fim_var = StringVar(value=datetime.now().strftime('%Y-%m-%d'))
        self.data_fim_entry = ttk.Entry(date_frame, textvariable=self.data_fim_var, 
                                       width=14, state="disabled", font=('Segoe UI', 11))
        self.data_fim_entry.grid(row=0, column=3, sticky=W)
        
        ttk.Label(date_frame, text="(formato: AAAA-MM-DD)", 
                 font=('Segoe UI', 9), foreground='gray').grid(
            row=1, column=0, columnspan=4, sticky=W, pady=(2, 0))
        
        # Separator
        ttk.Separator(main_frame, orient=HORIZONTAL).grid(
            row=11, column=0, columnspan=3, sticky=(W, E), pady=15)
        
        # Botão buscar
        self.buscar_btn = ttk.Button(main_frame, text="🔍 Buscar Publicações", 
                                     command=self.buscar_publicacoes)
        self.buscar_btn.grid(row=12, column=0, columnspan=3, pady=10)
        
        # Área de resultado
        ttk.Label(main_frame, text="Resultado:", font=('Segoe UI', 12, 'bold')).grid(
            row=13, column=0, columnspan=3, sticky=W, pady=(10, 5))
        
        # Aumentar área de resultado e fonte para melhor legibilidade
        self.result_text = scrolledtext.ScrolledText(main_frame, width=90, height=18, 
                                                     font=('Consolas', 10), wrap=WORD)
        self.result_text.grid(row=14, column=0, columnspan=3, pady=(0, 10), sticky=(N, S, E, W))
        main_frame.rowconfigure(14, weight=1)  # Expandir área de resultado
        
        # Botões inferiores
        btn_frame = ttk.Frame(main_frame)
        btn_frame.grid(row=15, column=0, columnspan=3, pady=5)
        
        ttk.Button(btn_frame, text="📁 Abrir Pasta de Resultados", 
                  command=self.abrir_pasta).grid(row=0, column=0, padx=5)
        
        self.pdf_btn = ttk.Button(btn_frame, text="📄 Gerar PDF", 
                                  command=self.gerar_pdf, state="disabled")
        self.pdf_btn.grid(row=0, column=1, padx=5)
        
        self.print_btn = ttk.Button(btn_frame, text="🖨️ Imprimir PDF", 
                                    command=self.imprimir_pdf, state="disabled")
        self.print_btn.grid(row=0, column=2, padx=5)
        
        ttk.Button(btn_frame, text="🗑️ Limpar", 
                  command=self.limpar_resultado).grid(row=0, column=3, padx=5)
    
    def on_tipo_busca_changed(self, event=None):
        """Ajusta campos baseado no tipo de busca selecionado."""
        tipo = self.tipo_busca_var.get().split(' - ')[0]  # Pega apenas 'ambos', 'oab' ou 'nome'
        
        if tipo == "ambos":
            # Ambos os campos habilitados
            self.oab_entry.config(state="normal")
            self.nome_entry.config(state="normal")
            self.oab_label.config(foreground="")
            self.nome_label.config(foreground="")
        elif tipo == "oab":
            # Apenas OAB
            self.oab_entry.config(state="normal")
            self.nome_entry.config(state="disabled")
            self.nome_var.set("")
            self.oab_label.config(foreground="")
            self.nome_label.config(foreground="gray")
        elif tipo == "nome":
            # Apenas Nome
            self.oab_entry.config(state="disabled")
            self.oab_var.set("")
            self.nome_entry.config(state="normal")
            self.oab_label.config(foreground="gray")
            self.nome_label.config(foreground="")
        
    def toggle_date_fields(self):
        """Habilita/desabilita campos de data conforme seleção."""
        if self.periodo_var.get() == "hoje":
            self.data_inicio_entry.config(state="disabled")
            self.data_fim_entry.config(state="disabled")
        else:
            self.data_inicio_entry.config(state="normal")
            self.data_fim_entry.config(state="normal")
    
    def limpar_resultado(self):
        """Limpa a área de resultado."""
        self.result_text.delete(1.0, END)
    
    def abrir_pasta(self):
        """Abre a pasta de output."""
        if sys.platform == 'win32':
            os.startfile(OUTPUT_DIR)
        elif sys.platform == 'darwin':
            subprocess.Popen(['open', OUTPUT_DIR])
        else:
            subprocess.Popen(['xdg-open', OUTPUT_DIR])
    
    def buscar_publicacoes(self):
        """Executa a busca de publicações."""
        # Validar inputs
        tribunal = self.tribunal_var.get()
        oab = self.oab_var.get().strip()
        nome_advogado = self.nome_var.get().strip()
        
        # Validar que pelo menos um filtro está preenchido
        if not oab and not nome_advogado:
            messagebox.showerror("Erro", "Por favor, informe o número da OAB OU o nome do advogado.")
            return
        
        # Determinar período
        if self.periodo_var.get() == "hoje":
            data_inicio = datetime.now().strftime('%Y-%m-%d')
            data_fim = data_inicio
        else:
            data_inicio = self.data_inicio_var.get().strip()
            data_fim = self.data_fim_var.get().strip()
            
            # Validar formato de data
            try:
                datetime.strptime(data_inicio, '%Y-%m-%d')
                datetime.strptime(data_fim, '%Y-%m-%d')
            except ValueError:
                messagebox.showerror("Erro", 
                    "Formato de data inválido. Use AAAA-MM-DD (ex: 2026-02-11)")
                return
        
        # Limpar resultado anterior
        self.limpar_resultado()
        self.result_text.insert(END, "🔍 Consultando PJe Comunica API...\n")
        self.result_text.insert(END, f"   Tribunal: {tribunal}\n")
        if oab:
            self.result_text.insert(END, f"   OAB: {oab}\n")
        if nome_advogado:
            self.result_text.insert(END, f"   Nome: {nome_advogado}\n")
        self.result_text.insert(END, f"   Período: {data_inicio} a {data_fim}\n\n")
        self.result_text.update()
        
        # Desabilitar botão durante busca
        self.buscar_btn.config(state="disabled")
        self.root.update()
        
        try:
            # Buscar publicações
            data = fetch_publications(tribunal, oab, data_inicio, data_fim, nome_advogado if nome_advogado else None)
            
            if data is None:
                self.result_text.insert(END, "\n❌ Erro ao buscar publicações.\n", 'error')
                return
            
            items = data.get('items', [])
            count = len(items)
            
            if count == 0:
                self.result_text.insert(END, "📭 Nenhuma publicação encontrada no período.\n")
                return
            
            # Normalizar e salvar
            publications = normalize_publications(items)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"publications_{tribunal}_{oab}_{timestamp}.json"
            filepath = save_to_json(publications, filename)
            
            # Armazenar dados para PDF
            self.last_publications = publications
            self.last_json_file = filepath
            self.last_pdf_file = None
            
            # Habilitar botões de PDF
            self.pdf_btn.config(state="normal")
            
            # Mostrar resultado
            self.result_text.insert(END, f"✅ Sucesso! {count} publicação(ões) encontrada(s).\n\n")
            self.result_text.insert(END, f"💾 Salvo em: {filepath}\n\n")
            self.result_text.insert(END, "=" * 70 + "\n\n")
            
            # Detalhes das publicações
            for i, pub in enumerate(publications, 1):
                self.result_text.insert(END, f"📋 Publicação {i}\n")
                self.result_text.insert(END, f"   Processo: {pub['numero_processo'] or 'Não identificado'}\n")
                self.result_text.insert(END, f"   Tribunal: {pub['tribunal']}\n")
                self.result_text.insert(END, f"   Data: {pub['data_disponibilizacao']}\n")
                self.result_text.insert(END, f"   Tipo: {pub['tipo_comunicacao']}\n")
                self.result_text.insert(END, f"   Órgão: {pub['orgao']}\n")
                self.result_text.insert(END, f"   Resumo: {pub['texto_resumo'][:150]}...\n\n")
            
            messagebox.showinfo("Sucesso", 
                f"{count} publicação(ões) encontrada(s)!\nArquivo salvo em:\n{filename}")
            
        except Exception as e:
            self.result_text.insert(END, f"\n❌ Erro: {str(e)}\n")
            messagebox.showerror("Erro", f"Ocorreu um erro:\n{str(e)}")
        
        finally:
            # Reabilitar botão
            self.buscar_btn.config(state="normal")
    
    def gerar_pdf(self):
        """Gera PDF a partir das publicações encontradas."""
        if not self.last_publications:
            messagebox.showwarning("Aviso", "Nenhuma publicação para gerar PDF.\nFaça uma busca primeiro.")
            return
        
        try:
            # Nome do arquivo PDF
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"publicacoes_{timestamp}.pdf"
            filepath = OUTPUT_DIR / filename
            
            # Criar PDF
            doc = SimpleDocTemplate(
                str(filepath),
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Preparar conteúdo
            story = []
            styles = getSampleStyleSheet()
            
            # Estilo customizado
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor('#1a237e'),
                spaceAfter=20,
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#283593'),
                spaceAfter=10,
                spaceBefore=10
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6
            )
            
            text_style = ParagraphStyle(
                'CustomText',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_JUSTIFY,
                spaceAfter=8
            )
            
            # Título do documento
            story.append(Paragraph("Publicações Jurídicas", title_style))
            story.append(Paragraph(
                f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
                styles['Normal']
            ))
            story.append(Spacer(1, 0.5*cm))
            
            # Sumário
            story.append(Paragraph(f"<b>Total de publicações:</b> {len(self.last_publications)}", normal_style))
            if self.last_publications:
                tribunais = set(p['tribunal'] for p in self.last_publications)
                story.append(Paragraph(f"<b>Tribunais:</b> {', '.join(tribunais)}", normal_style))
            story.append(Spacer(1, 0.8*cm))
            
            # Publicações
            for i, pub in enumerate(self.last_publications, 1):
                # Cabeçalho da publicação
                story.append(Paragraph(f"<b>Publicação {i}</b>", heading_style))
                
                # Dados em tabela
                data = [
                    ['Processo:', pub['numero_processo'] or 'Não identificado'],
                    ['Tribunal:', pub['tribunal']],
                    ['Data:', pub['data_disponibilizacao']],
                    ['Tipo:', pub['tipo_comunicacao']],
                    ['Órgão:', pub['orgao']],
                ]
                
                if pub.get('meio'):
                    data.append(['Meio:', pub['meio']])
                
                table = Table(data, colWidths=[3.5*cm, 13*cm])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
                    ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1a237e')),
                    ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ]))
                
                story.append(table)
                story.append(Spacer(1, 0.3*cm))
                
                # Texto completo
                story.append(Paragraph("<b>Texto completo:</b>", normal_style))
                texto_limpo = pub['texto_completo'].replace('\n', '<br/>')
                story.append(Paragraph(texto_limpo, text_style))
                
                # Separador entre publicações
                if i < len(self.last_publications):
                    story.append(Spacer(1, 0.5*cm))
                    story.append(PageBreak())
            
            # Gerar PDF
            doc.build(story)
            
            # Atualizar variáveis
            self.last_pdf_file = filepath
            self.print_btn.config(state="normal")
            
            # Mostrar mensagem
            self.result_text.insert(END, f"\n📄 PDF gerado: {filename}\n")
            messagebox.showinfo("Sucesso", f"PDF gerado com sucesso!\n\n{filename}\n\nUse o botão 'Imprimir PDF' para visualizar.")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar PDF:\n{str(e)}")
    
    def imprimir_pdf(self):
        """Abre o PDF gerado para visualização/impressão."""
        if not self.last_pdf_file or not self.last_pdf_file.exists():
            messagebox.showwarning("Aviso", "Nenhum PDF foi gerado ainda.\nGere o PDF primeiro.")
            return
        
        try:
            # Abrir o PDF no visualizador padrão
            if sys.platform == 'win32':
                os.startfile(self.last_pdf_file)
            elif sys.platform == 'darwin':
                subprocess.Popen(['open', self.last_pdf_file])
            else:
                subprocess.Popen(['xdg-open', self.last_pdf_file])
            
            self.result_text.insert(END, f"\n🖨️ PDF aberto para visualização/impressão\n")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao abrir PDF:\n{str(e)}")


def main():
    root = Tk()
    app = PublicationFetcherGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

