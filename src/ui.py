"""
PySide6 UI for Client registration and management
Accessible design for low vision users
"""

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QComboBox, QPushButton, QTableWidget, QTableWidgetItem,
    QTabWidget, QFormLayout, QMessageBox, QTextEdit,
    QDialog
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QColor, QPalette
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session
from src.database import SessionLocal, init_db
from src.models import ClientType, CaseStatus, CasePriority
from src.crud import ClientCRUD, CaseCRUD, NoticeCRUD


class Theme:
    """Theme configuration class"""
    def __init__(self, name, bg, text, button_bg, button_text, accent, table_alt):
        self.name = name
        self.bg = bg
        self.text = text
        self.button_bg = button_bg
        self.button_text = button_text
        self.accent = accent
        self.table_alt = table_alt


class AccessibleConfig:
    """Accessible UI configuration for low vision users"""
    
    # Font sizes (base values, can be scaled)
    _font_scale = 1.0
    FONT_FAMILY = "Verdana"  # More readable font
    
    # Available themes
    THEMES = {
        "Claro Azul": Theme(
            "Claro Azul",
            QColor(255, 255, 255),   # bg: white
            QColor(0, 0, 0),          # text: black
            QColor(14, 14, 85),       # button_bg: navy blue (#0E0E55)
            QColor(255, 255, 255),    # button_text: white
            QColor(14, 14, 85),       # accent: navy blue
            QColor(240, 245, 255)     # table_alt: very light blue
        ),
        "Alto Contraste Escuro": Theme(
            "Alto Contraste Escuro",
            QColor(0, 0, 0),          # bg: black
            QColor(255, 255, 255),    # text: white
            QColor(255, 255, 0),      # button_bg: yellow
            QColor(0, 0, 0),          # button_text: black
            QColor(0, 255, 255),      # accent: cyan
            QColor(30, 30, 30)        # table_alt: dark gray
        ),
        "Ciano Suave": Theme(
            "Ciano Suave",
            QColor(0, 40, 50),        # bg: dark cyan
            QColor(0, 255, 255),      # text: cyan
            QColor(0, 150, 150),      # button_bg: teal
            QColor(255, 255, 255),    # button_text: white
            QColor(255, 255, 0),      # accent: yellow
            QColor(0, 60, 70)         # table_alt: darker cyan
        ),
        "Verde Conforto": Theme(
            "Verde Conforto",
            QColor(20, 40, 20),       # bg: dark green
            QColor(0, 255, 100),      # text: bright green
            QColor(0, 120, 60),       # button_bg: medium green
            QColor(255, 255, 255),    # button_text: white
            QColor(255, 255, 0),      # accent: yellow
            QColor(30, 50, 30)        # table_alt: darker green
        ),
        "Azul Noturno": Theme(
            "Azul Noturno",
            QColor(15, 15, 40),       # bg: dark blue
            QColor(200, 220, 255),    # text: light blue
            QColor(60, 80, 150),      # button_bg: medium blue
            QColor(255, 255, 255),    # button_text: white
            QColor(100, 200, 255),    # accent: sky blue
            QColor(25, 25, 50)        # table_alt: darker blue
        )
    }
    
    _current_theme = THEMES["Claro Azul"]
    
    # Colors (dynamically set by theme)
    BG_COLOR = _current_theme.bg
    TEXT_COLOR = _current_theme.text
    ACCENT_COLOR = _current_theme.accent
    BUTTON_COLOR = _current_theme.button_bg
    BUTTON_TEXT_COLOR = _current_theme.button_text
    TABLE_ALT_COLOR = _current_theme.table_alt
    WARNING_COLOR = QColor(255, 50, 50)  # Always bright red
    
    @staticmethod
    def get_font(size_multiplier=1.0, bold=False):
        """Get font with current scale"""
        size = int(14 * AccessibleConfig._font_scale * size_multiplier)
        weight = QFont.Weight.Bold if bold else QFont.Weight.Normal
        return QFont(AccessibleConfig.FONT_FAMILY, size, weight)
    
    @staticmethod
    def set_theme(theme_name):
        """Change current theme"""
        if theme_name in AccessibleConfig.THEMES:
            AccessibleConfig._current_theme = AccessibleConfig.THEMES[theme_name]
            AccessibleConfig.BG_COLOR = AccessibleConfig._current_theme.bg
            AccessibleConfig.TEXT_COLOR = AccessibleConfig._current_theme.text
            AccessibleConfig.ACCENT_COLOR = AccessibleConfig._current_theme.accent
            AccessibleConfig.BUTTON_COLOR = AccessibleConfig._current_theme.button_bg
            AccessibleConfig.BUTTON_TEXT_COLOR = AccessibleConfig._current_theme.button_text
            AccessibleConfig.TABLE_ALT_COLOR = AccessibleConfig._current_theme.table_alt
    
    @staticmethod
    def set_font_scale(scale):
        """Set font scale multiplier"""
        AccessibleConfig._font_scale = max(0.5, min(3.0, scale))
    
    @staticmethod
    def apply_theme(widget):
        """Apply accessible theme to widget"""
        palette = widget.palette()
        palette.setColor(QPalette.ColorRole.Window, AccessibleConfig.BG_COLOR)
        palette.setColor(QPalette.ColorRole.WindowText, AccessibleConfig.TEXT_COLOR)
        palette.setColor(QPalette.ColorRole.Button, AccessibleConfig.BUTTON_COLOR)
        palette.setColor(QPalette.ColorRole.ButtonText, AccessibleConfig.BUTTON_TEXT_COLOR)
        palette.setColor(QPalette.ColorRole.Base, AccessibleConfig.BG_COLOR)
        palette.setColor(QPalette.ColorRole.AlternateBase, AccessibleConfig.TABLE_ALT_COLOR)
        palette.setColor(QPalette.ColorRole.Text, AccessibleConfig.TEXT_COLOR)
        palette.setColor(QPalette.ColorRole.Highlight, AccessibleConfig.ACCENT_COLOR)
        palette.setColor(QPalette.ColorRole.HighlightedText, AccessibleConfig.BG_COLOR)
        widget.setPalette(palette)
        
        # Apply stylesheet for better styling
        widget.setStyleSheet(f"""
            QPushButton {{
                background-color: {AccessibleConfig.BUTTON_COLOR.name()};
                color: {AccessibleConfig.BUTTON_TEXT_COLOR.name()};
                border: 2px solid {AccessibleConfig.BUTTON_COLOR.name()};
                border-radius: 5px;
                padding: 5px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {AccessibleConfig.ACCENT_COLOR.name()};
                color: {AccessibleConfig.BUTTON_TEXT_COLOR.name()};
                border: 2px solid {AccessibleConfig.ACCENT_COLOR.name()};
            }}
            QPushButton:focus {{
                background-color: {AccessibleConfig.ACCENT_COLOR.name()};
                color: {AccessibleConfig.BUTTON_TEXT_COLOR.name()};
                border: 2px solid {AccessibleConfig.ACCENT_COLOR.name()};
            }}
            QPushButton#filterButton {{
                background-color: #E0E0E0;
                color: #000000;
                border: 1px solid #CCCCCC;
                border-radius: 3px;
                padding: 8px 16px;
                font-weight: normal;
            }}
            QPushButton#filterButton:hover {{
                background-color: #D0D0D0;
                color: #000000;
                border: 1px solid #CCCCCC;
            }}
            QPushButton#filterButton:checked {{
                background-color: {AccessibleConfig.BUTTON_COLOR.name()};
                color: {AccessibleConfig.BUTTON_TEXT_COLOR.name()};
                border: 2px solid {AccessibleConfig.BUTTON_COLOR.name()};
                font-weight: bold;
            }}
            QTableWidget {{
                background-color: #F5F5F5;
                gridline-color: #F5F5F5;
                selection-background-color: {AccessibleConfig.ACCENT_COLOR.name()};
                alternate-background-color: #F5F5F5;
            }}
            QTableWidget::item {{
                padding: 5px;
                background-color: #F5F5F5;
            }}
            QHeaderView::section {{
                background-color: #E0E0E0;
                color: #000000;
                padding: 5px;
                border: none;
                border-right: 1px solid #CCCCCC;
                border-bottom: 1px solid #CCCCCC;
            }}
            QLineEdit, QTextEdit, QComboBox {{
                background-color: {AccessibleConfig.BG_COLOR.name()};
                color: {AccessibleConfig.TEXT_COLOR.name()};
                border: 2px solid {AccessibleConfig.ACCENT_COLOR.name()};
                padding: 3px;
            }}
            QTabBar::tab {{
                background-color: #E0E0E0;
                color: #000000;
                padding: 8px 16px;
                border: 1px solid #CCCCCC;
                border-bottom: none;
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
                margin-right: 2px;
            }}
            QTabBar::tab:selected {{
                background-color: {AccessibleConfig.BUTTON_COLOR.name()};
                color: {AccessibleConfig.BUTTON_TEXT_COLOR.name()};
                font-weight: bold;
                border: 2px solid {AccessibleConfig.BUTTON_COLOR.name()};
            }}
            QTabBar::tab:hover:!selected {{
                background-color: #D0D0D0;
            }}
        """)


class ClientFormDialog(QDialog):
    """Dialog for creating/editing clients"""
    
    def __init__(self, parent=None, client=None, db: Optional[Session] = None):
        super().__init__(parent)
        self.client = client
        self.db = db or SessionLocal()
        self.init_ui()
    
    def init_ui(self):
        """Initialize UI"""
        self.setWindowTitle("Cadastro de Cliente")
        self.setMinimumSize(600, 700)
        
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Cadastro de Cliente")
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)
        
        # Form layout
        form = QFormLayout()
        form.setSpacing(15)
        
        # Cliente Type
        type_label = QLabel("Tipo de Cliente:")
        type_label.setFont(AccessibleConfig.get_font())
        self.type_combo = QComboBox()
        self.type_combo.addItems([ClientType.PERSON.value, ClientType.LEGAL_ENTITY.value])
        self.type_combo.setMinimumHeight(40)
        self.type_combo.setFont(AccessibleConfig.get_font())
        form.addRow(type_label, self.type_combo)
        
        # Name
        name_label = QLabel("Nome/Razão Social:")
        name_label.setFont(AccessibleConfig.get_font())
        self.name_input = QLineEdit()
        self.name_input.setMinimumHeight(40)
        self.name_input.setFont(AccessibleConfig.get_font())
        if self.client:
            self.name_input.setText(self.client.name)
        form.addRow(name_label, self.name_input)
        
        # CPF/CNPJ
        cpf_label = QLabel("CPF:")
        cpf_label.setFont(AccessibleConfig.get_font())
        self.cpf_input = QLineEdit()
        self.cpf_input.setMinimumHeight(40)
        self.cpf_input.setFont(AccessibleConfig.get_font())
        form.addRow(cpf_label, self.cpf_input)

        rg_label = QLabel("RG:")
        rg_label.setFont(AccessibleConfig.get_font())
        self.rg_input = QLineEdit()
        self.rg_input.setMinimumHeight(40)
        self.rg_input.setFont(AccessibleConfig.get_font())
        form.addRow(rg_label, self.rg_input)

        profession_label = QLabel("Profissão:")
        profession_label.setFont(AccessibleConfig.get_font())
        self.profession_input = QLineEdit()
        self.profession_input.setMinimumHeight(40)
        self.profession_input.setFont(AccessibleConfig.get_font())
        form.addRow(profession_label, self.profession_input)

        marital_label = QLabel("Estado Civil:")
        marital_label.setFont(AccessibleConfig.get_font())
        self.marital_input = QLineEdit()
        self.marital_input.setMinimumHeight(40)
        self.marital_input.setFont(AccessibleConfig.get_font())
        form.addRow(marital_label, self.marital_input)

        cnpj_label = QLabel("CNPJ:")
        cnpj_label.setFont(AccessibleConfig.get_font())
        self.cnpj_input = QLineEdit()
        self.cnpj_input.setMinimumHeight(40)
        self.cnpj_input.setFont(AccessibleConfig.get_font())
        form.addRow(cnpj_label, self.cnpj_input)

        company_label = QLabel("Razão Social:")
        company_label.setFont(AccessibleConfig.get_font())
        self.company_input = QLineEdit()
        self.company_input.setMinimumHeight(40)
        self.company_input.setFont(AccessibleConfig.get_font())
        form.addRow(company_label, self.company_input)

        legal_rep_label = QLabel("Representante Legal:")
        legal_rep_label.setFont(AccessibleConfig.get_font())
        self.legal_rep_input = QLineEdit()
        self.legal_rep_input.setMinimumHeight(40)
        self.legal_rep_input.setFont(AccessibleConfig.get_font())
        form.addRow(legal_rep_label, self.legal_rep_input)
        
        # Email
        email_label = QLabel("Email:")
        email_label.setFont(AccessibleConfig.get_font())
        self.email_input = QLineEdit()
        self.email_input.setMinimumHeight(40)
        self.email_input.setFont(AccessibleConfig.get_font())
        form.addRow(email_label, self.email_input)
        
        # Phone
        phone_label = QLabel("Telefone:")
        phone_label.setFont(AccessibleConfig.get_font())
        self.phone_input = QLineEdit()
        self.phone_input.setMinimumHeight(40)
        self.phone_input.setFont(AccessibleConfig.get_font())
        form.addRow(phone_label, self.phone_input)
        
        # Address
        address_label = QLabel("Endereço:")
        address_label.setFont(AccessibleConfig.get_font())
        self.address_input = QLineEdit()
        self.address_input.setMinimumHeight(40)
        self.address_input.setFont(AccessibleConfig.get_font())
        form.addRow(address_label, self.address_input)

        number_label = QLabel("Número:")
        number_label.setFont(AccessibleConfig.get_font())
        self.number_input = QLineEdit()
        self.number_input.setMinimumHeight(40)
        self.number_input.setFont(AccessibleConfig.get_font())
        form.addRow(number_label, self.number_input)

        complement_label = QLabel("Complemento:")
        complement_label.setFont(AccessibleConfig.get_font())
        self.complement_input = QLineEdit()
        self.complement_input.setMinimumHeight(40)
        self.complement_input.setFont(AccessibleConfig.get_font())
        form.addRow(complement_label, self.complement_input)

        neighborhood_label = QLabel("Bairro:")
        neighborhood_label.setFont(AccessibleConfig.get_font())
        self.neighborhood_input = QLineEdit()
        self.neighborhood_input.setMinimumHeight(40)
        self.neighborhood_input.setFont(AccessibleConfig.get_font())
        form.addRow(neighborhood_label, self.neighborhood_input)
        
        # City/State/Zip
        city_label = QLabel("Cidade:")
        city_label.setFont(AccessibleConfig.get_font())
        self.city_input = QLineEdit()
        self.city_input.setMinimumHeight(40)
        self.city_input.setFont(AccessibleConfig.get_font())
        form.addRow(city_label, self.city_input)
        
        state_label = QLabel("Estado (UF):")
        state_label.setFont(AccessibleConfig.get_font())
        self.state_input = QLineEdit()
        self.state_input.setMaximumWidth(100)
        self.state_input.setMinimumHeight(40)
        self.state_input.setFont(AccessibleConfig.get_font())
        form.addRow(state_label, self.state_input)

        zipcode_label = QLabel("CEP:")
        zipcode_label.setFont(AccessibleConfig.get_font())
        self.zipcode_input = QLineEdit()
        self.zipcode_input.setMinimumHeight(40)
        self.zipcode_input.setFont(AccessibleConfig.get_font())
        form.addRow(zipcode_label, self.zipcode_input)
        
        # Notes
        notes_label = QLabel("Observações:")
        notes_label.setFont(AccessibleConfig.get_font())
        self.notes_input = QTextEdit()
        self.notes_input.setMinimumHeight(100)
        self.notes_input.setFont(AccessibleConfig.get_font())
        form.addRow(notes_label, self.notes_input)
        
        layout.addLayout(form)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        save_btn = QPushButton("Salvar")
        save_btn.setMinimumHeight(50)
        save_btn.setFont(AccessibleConfig.get_font())
        save_btn.clicked.connect(self.save_client)
        button_layout.addWidget(save_btn)
        
        cancel_btn = QPushButton("Cancelar")
        cancel_btn.setMinimumHeight(50)
        cancel_btn.setFont(AccessibleConfig.get_font())
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)

        self.type_combo.currentTextChanged.connect(self.update_form_visibility)
        self.update_form_visibility()

        if self.client:
            self.type_combo.setCurrentText(self.client.client_type.value)
            self.cpf_input.setText(self.client.cpf or "")
            self.rg_input.setText(self.client.rg or "")
            self.profession_input.setText(self.client.profession or "")
            self.marital_input.setText(self.client.marital_status or "")
            self.cnpj_input.setText(self.client.cnpj or "")
            self.company_input.setText(self.client.company_name or "")
            self.legal_rep_input.setText(self.client.legal_representative or "")
            self.email_input.setText(self.client.email or "")
            self.phone_input.setText(self.client.phone or "")
            self.address_input.setText(self.client.address or "")
            self.number_input.setText(self.client.number or "")
            self.complement_input.setText(self.client.complement or "")
            self.neighborhood_input.setText(self.client.neighborhood or "")
            self.city_input.setText(self.client.city or "")
            self.state_input.setText(self.client.state or "")
            self.zipcode_input.setText(self.client.zipcode or "")
            self.notes_input.setPlainText(self.client.notes or "")

    def update_form_visibility(self):
        """Enable/disable fields based on client type"""
        is_person = self.type_combo.currentText() == ClientType.PERSON.value
        self.cpf_input.setEnabled(is_person)
        self.rg_input.setEnabled(is_person)
        self.profession_input.setEnabled(is_person)
        self.marital_input.setEnabled(is_person)

        self.cnpj_input.setEnabled(not is_person)
        self.company_input.setEnabled(not is_person)
        self.legal_rep_input.setEnabled(not is_person)
    
    def save_client(self):
        """Save client to database"""
        try:
            name = self.name_input.text().strip()
            client_type = self.type_combo.currentText()
            email = self.email_input.text().strip() or None
            phone = self.phone_input.text().strip() or None
            cpf = self.cpf_input.text().strip() or None
            cnpj = self.cnpj_input.text().strip() or None
            
            if not name:
                QMessageBox.warning(self, "Erro", "Nome é obrigatório!")
                return
            
            if self.client:
                # Update
                ClientCRUD.update(
                    self.db,
                    self.client.id,
                    name=name,
                    client_type=client_type,
                    cpf=cpf if client_type == ClientType.PERSON.value else None,
                    rg=self.rg_input.text() or None,
                    profession=self.profession_input.text() or None,
                    marital_status=self.marital_input.text() or None,
                    cnpj=cnpj if client_type == ClientType.LEGAL_ENTITY.value else None,
                    company_name=self.company_input.text() or None,
                    legal_representative=self.legal_rep_input.text() or None,
                    email=email,
                    phone=phone,
                    address=self.address_input.text() or None,
                    number=self.number_input.text() or None,
                    complement=self.complement_input.text() or None,
                    neighborhood=self.neighborhood_input.text() or None,
                    city=self.city_input.text() or None,
                    state=self.state_input.text() or None,
                    zipcode=self.zipcode_input.text() or None,
                    notes=self.notes_input.toPlainText() or None
                )
            else:
                # Create
                ClientCRUD.create(
                    self.db,
                    name=name,
                    client_type=client_type,
                    cpf=cpf if client_type == ClientType.PERSON.value else None,
                    rg=self.rg_input.text() or None,
                    profession=self.profession_input.text() or None,
                    marital_status=self.marital_input.text() or None,
                    cnpj=cnpj if client_type == ClientType.LEGAL_ENTITY.value else None,
                    company_name=self.company_input.text() or None,
                    legal_representative=self.legal_rep_input.text() or None,
                    email=email,
                    phone=phone,
                    address=self.address_input.text() or None,
                    number=self.number_input.text() or None,
                    complement=self.complement_input.text() or None,
                    neighborhood=self.neighborhood_input.text() or None,
                    city=self.city_input.text() or None,
                    state=self.state_input.text() or None,
                    zipcode=self.zipcode_input.text() or None,
                    notes=self.notes_input.toPlainText() or None
                )
            
            QMessageBox.information(self, "Sucesso", "Cliente salvo com sucesso!")
            self.accept()
        
        except Exception as e:
            QMessageBox.critical(self, "Erro", f"Erro ao salvar cliente: {str(e)}")


class ClientListWidget(QWidget):
    """Client list and management widget"""

    def __init__(self, db: Session):
        super().__init__()
        self.db = db
        self.init_ui()
    
    def init_ui(self):
        """Initialize UI"""
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Gestão de Clientes")
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)
        
        # Search bar
        search_layout = QHBoxLayout()
        search_label = QLabel("Pesquisar:")
        search_label.setFont(AccessibleConfig.get_font())
        self.search_input = QLineEdit()
        self.search_input.setMinimumHeight(40)
        self.search_input.setFont(AccessibleConfig.get_font())
        search_btn = QPushButton("Buscar")
        search_btn.setMinimumHeight(40)
        search_btn.setMinimumWidth(150)
        search_btn.setFont(AccessibleConfig.get_font())
        search_btn.clicked.connect(self.search_clients)
        
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(search_btn)
        layout.addLayout(search_layout)
        
        # Clients table
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["ID", "Nome", "Email", "Telefone", "Tipo", ""])
        self.table.setMinimumHeight(400)
        self.table.setFont(AccessibleConfig.get_font())
        self.table.setRowHeight(0, 40)
        
        # Style table headers
        header = self.table.horizontalHeader()
        header.setFont(AccessibleConfig.get_font(bold=True))
        header.setDefaultSectionSize(100)
        # Hide actions column header
        header.setSectionHidden(5, False)
        
        layout.addWidget(self.table)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        new_client_btn = QPushButton("+ Novo Cliente")
        new_client_btn.setMinimumHeight(50)
        new_client_btn.setFont(AccessibleConfig.get_font())
        new_client_btn.clicked.connect(self.new_client)
        button_layout.addWidget(new_client_btn)
        
        refresh_btn = QPushButton("Atualizar")
        refresh_btn.setMinimumHeight(50)
        refresh_btn.setFont(AccessibleConfig.get_font())
        refresh_btn.clicked.connect(self.load_clients)
        button_layout.addWidget(refresh_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)
        
        self.load_clients()
    
    def load_clients(self):
        """Load all clients into table"""
        self.table.setRowCount(0)
        clients = ClientCRUD.read_all(self.db, limit=1000)
        
        for row, client in enumerate(clients):
            self.table.insertRow(row)
            
            id_item = QTableWidgetItem(str(client.id))
            id_item.setFont(AccessibleConfig.get_font())
            self.table.setItem(row, 0, id_item)
            
            name_item = QTableWidgetItem(str(client.name))
            name_item.setFont(AccessibleConfig.get_font())
            self.table.setItem(row, 1, name_item)
            
            email_item = QTableWidgetItem(str(client.email or ""))
            email_item.setFont(AccessibleConfig.get_font())
            self.table.setItem(row, 2, email_item)
            
            phone_item = QTableWidgetItem(str(client.phone or ""))
            phone_item.setFont(AccessibleConfig.get_font())
            self.table.setItem(row, 3, phone_item)
            
            type_item = QTableWidgetItem(str(client.client_type.value))
            type_item.setFont(AccessibleConfig.get_font())
            self.table.setItem(row, 4, type_item)

            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(10, 2, 0, 2)
            action_layout.setSpacing(5)

            edit_btn = QPushButton('Editar')
            edit_btn.setFont(AccessibleConfig.get_font(0.9))
            edit_btn.setMinimumHeight(30)
            edit_btn.setMaximumHeight(35)
            edit_btn.clicked.connect(lambda _, c=client: self.edit_client(c))
            action_layout.addWidget(edit_btn)

            delete_btn = QPushButton('Excluir')
            delete_btn.setFont(AccessibleConfig.get_font(0.9))
            delete_btn.setMinimumHeight(30)
            delete_btn.setMaximumHeight(35)
            delete_btn.clicked.connect(lambda _, c=client: self.delete_client(c))
            action_layout.addWidget(delete_btn)

            self.table.setCellWidget(row, 5, action_widget)
            
            self.table.setRowHeight(row, 45)
    
    def new_client(self):
        """Open new client dialog"""
        dialog = ClientFormDialog(self, db=self.db)
        if dialog.exec():
            self.load_clients()

    def edit_client(self, client):
        """Open edit client dialog"""
        dialog = ClientFormDialog(self, client=client, db=self.db)
        if dialog.exec():
            self.load_clients()

    def delete_client(self, client):
        """Delete client with confirmation"""
        reply = QMessageBox.question(
            self,
            "Confirmar Exclusão",
            f"Deseja excluir o cliente '{client.name}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            ClientCRUD.delete(self.db, client.id)
            self.load_clients()
    
    def search_clients(self):
        """Search clients"""
        query = self.search_input.text().strip()
        if not query:
            self.load_clients()
            return
        
        self.table.setRowCount(0)
        clients = ClientCRUD.search(self.db, query)
        
        for row, client in enumerate(clients):
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(str(client.id)))
            self.table.setItem(row, 1, QTableWidgetItem(str(client.name)))
            self.table.setItem(row, 2, QTableWidgetItem(str(client.email or "")))
            self.table.setItem(row, 3, QTableWidgetItem(str(client.phone or "")))
            self.table.setItem(row, 4, QTableWidgetItem(str(client.client_type.value)))

            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(10, 2, 0, 2)
            action_layout.setSpacing(5)

            edit_btn = QPushButton('Editar')
            edit_btn.setFont(AccessibleConfig.get_font(0.9))
            edit_btn.setMinimumHeight(30)
            edit_btn.setMaximumHeight(35)
            edit_btn.clicked.connect(lambda _, c=client: self.edit_client(c))
            action_layout.addWidget(edit_btn)

            delete_btn = QPushButton('Excluir')
            delete_btn.setFont(AccessibleConfig.get_font(0.9))
            delete_btn.setMinimumHeight(30)
            delete_btn.setMaximumHeight(35)
            delete_btn.clicked.connect(lambda _, c=client: self.delete_client(c))
            action_layout.addWidget(delete_btn)

            self.table.setCellWidget(row, 5, action_widget)
            self.table.setRowHeight(row, 45)
    
    def refresh_theme(self):
        """Refresh theme and fonts"""
        AccessibleConfig.apply_theme(self)
        
        # Update all labeled elements
        for i in range(self.layout().count()):
            item = self.layout().itemAt(i)
            if item.layout():
                # It's a layout, iterate its widgets
                for j in range(item.layout().count()):
                    widget = item.layout().itemAt(j).widget()
                    if widget:
                        if isinstance(widget, QLabel):
                            widget.setFont(AccessibleConfig.get_font(bold=True))
                        elif isinstance(widget, (QPushButton, QLineEdit)):
                            widget.setFont(AccessibleConfig.get_font())
            elif item.widget():
                widget = item.widget()
                if isinstance(widget, QTableWidget):
                    widget.setFont(AccessibleConfig.get_font())
        
        # Reload to refresh table fonts
        self.load_clients()


class CaseFormDialog(QDialog):
    """Dialog for creating/editing cases"""

    def __init__(self, parent=None, case=None, db: Optional[Session] = None):
        super().__init__(parent)
        self.case = case
        self.db = db or SessionLocal()
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("Cadastro de Processo")
        self.setMinimumSize(700, 750)

        layout = QVBoxLayout()
        title = QLabel("Cadastro de Processo")
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)

        form = QFormLayout()
        form.setSpacing(15)

        # Client
        client_label = QLabel("Cliente:")
        client_label.setFont(AccessibleConfig.get_font())
        self.client_combo = QComboBox()
        self.client_combo.setMinimumHeight(40)
        self.client_combo.setFont(AccessibleConfig.get_font())
        self.load_clients()
        form.addRow(client_label, self.client_combo)

        # Case number
        case_number_label = QLabel("Número do Processo:")
        case_number_label.setFont(AccessibleConfig.get_font())
        self.case_number_input = QLineEdit()
        self.case_number_input.setMinimumHeight(40)
        self.case_number_input.setFont(AccessibleConfig.get_font())
        form.addRow(case_number_label, self.case_number_input)

        # Case type
        case_type_label = QLabel("Tipo de Ação:")
        case_type_label.setFont(AccessibleConfig.get_font())
        self.case_type_input = QLineEdit()
        self.case_type_input.setMinimumHeight(40)
        self.case_type_input.setFont(AccessibleConfig.get_font())
        form.addRow(case_type_label, self.case_type_input)

        # Opposing party
        opposing_label = QLabel("Parte Contrária:")
        opposing_label.setFont(AccessibleConfig.get_font())
        self.opposing_input = QLineEdit()
        self.opposing_input.setMinimumHeight(40)
        self.opposing_input.setFont(AccessibleConfig.get_font())
        form.addRow(opposing_label, self.opposing_input)

        # Court
        court_label = QLabel("Foro/Tribunal:")
        court_label.setFont(AccessibleConfig.get_font())
        self.court_input = QLineEdit()
        self.court_input.setMinimumHeight(40)
        self.court_input.setFont(AccessibleConfig.get_font())
        form.addRow(court_label, self.court_input)

        judge_label = QLabel("Juiz/Relator:")
        judge_label.setFont(AccessibleConfig.get_font())
        self.judge_input = QLineEdit()
        self.judge_input.setMinimumHeight(40)
        self.judge_input.setFont(AccessibleConfig.get_font())
        form.addRow(judge_label, self.judge_input)

        area_label = QLabel("Área Jurídica:")
        area_label.setFont(AccessibleConfig.get_font())
        self.area_input = QLineEdit()
        self.area_input.setMinimumHeight(40)
        self.area_input.setFont(AccessibleConfig.get_font())
        form.addRow(area_label, self.area_input)

        # Status/Priority
        status_label = QLabel("Status:")
        status_label.setFont(AccessibleConfig.get_font())
        self.status_combo = QComboBox()
        self.status_combo.addItems([s.value for s in CaseStatus])
        self.status_combo.setMinimumHeight(40)
        self.status_combo.setFont(AccessibleConfig.get_font())
        form.addRow(status_label, self.status_combo)

        priority_label = QLabel("Prioridade:")
        priority_label.setFont(AccessibleConfig.get_font())
        self.priority_combo = QComboBox()
        self.priority_combo.addItems([p.value for p in CasePriority])
        self.priority_combo.setMinimumHeight(40)
        self.priority_combo.setFont(AccessibleConfig.get_font())
        form.addRow(priority_label, self.priority_combo)

        # Dates
        filing_label = QLabel("Data de Distribuição (AAAA-MM-DD):")
        filing_label.setFont(AccessibleConfig.get_font())
        self.filing_input = QLineEdit()
        self.filing_input.setMinimumHeight(40)
        self.filing_input.setFont(AccessibleConfig.get_font())
        form.addRow(filing_label, self.filing_input)

        deadline_label = QLabel("Próximo Prazo (AAAA-MM-DD):")
        deadline_label.setFont(AccessibleConfig.get_font())
        self.deadline_input = QLineEdit()
        self.deadline_input.setMinimumHeight(40)
        self.deadline_input.setFont(AccessibleConfig.get_font())
        form.addRow(deadline_label, self.deadline_input)

        conclusion_label = QLabel("Conclusão (AAAA-MM-DD):")
        conclusion_label.setFont(AccessibleConfig.get_font())
        self.conclusion_input = QLineEdit()
        self.conclusion_input.setMinimumHeight(40)
        self.conclusion_input.setFont(AccessibleConfig.get_font())
        form.addRow(conclusion_label, self.conclusion_input)

        # Claim value
        value_label = QLabel("Valor da Causa:")
        value_label.setFont(AccessibleConfig.get_font())
        self.value_input = QLineEdit()
        self.value_input.setMinimumHeight(40)
        self.value_input.setFont(AccessibleConfig.get_font())
        form.addRow(value_label, self.value_input)

        # Notes
        notes_label = QLabel("Descrição/Observações:")
        notes_label.setFont(AccessibleConfig.get_font())
        self.notes_input = QTextEdit()
        self.notes_input.setMinimumHeight(120)
        self.notes_input.setFont(AccessibleConfig.get_font())
        form.addRow(notes_label, self.notes_input)

        layout.addLayout(form)

        # Buttons
        button_layout = QHBoxLayout()
        save_btn = QPushButton("Salvar")
        save_btn.setMinimumHeight(50)
        save_btn.setFont(AccessibleConfig.get_font())
        save_btn.clicked.connect(self.save_case)
        button_layout.addWidget(save_btn)

        cancel_btn = QPushButton("Cancelar")
        cancel_btn.setMinimumHeight(50)
        cancel_btn.setFont(AccessibleConfig.get_font())
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        layout.addLayout(button_layout)
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)

        if self.case:
            self.populate_fields()

    def load_clients(self):
        self.client_combo.clear()
        clients = ClientCRUD.read_all(self.db, limit=1000)
        for client in clients:
            self.client_combo.addItem(f"{client.id} - {client.name}", client.id)

    def populate_fields(self):
        if not self.case:
            return
        self.client_combo.setCurrentIndex(
            max(0, self.client_combo.findData(self.case.client_id))
        )
        self.case_number_input.setText(self.case.case_number)
        self.case_type_input.setText(self.case.case_type)
        self.opposing_input.setText(self.case.opposing_party)
        self.court_input.setText(self.case.court)
        self.judge_input.setText(self.case.judge or "")
        self.area_input.setText(self.case.legal_area or "")
        self.status_combo.setCurrentText(self.case.status.value)
        self.priority_combo.setCurrentText(self.case.priority.value)
        self.filing_input.setText(self.case.filing_date.isoformat() if self.case.filing_date else "")
        self.deadline_input.setText(self.case.deadline.isoformat() if self.case.deadline else "")
        self.conclusion_input.setText(self.case.conclusion_date.isoformat() if self.case.conclusion_date else "")
        self.value_input.setText(self.case.claim_value or "")
        self.notes_input.setPlainText(self.case.notes or "")

    @staticmethod
    def parse_date(value: str):
        if not value:
            return None
        return datetime.strptime(value, "%Y-%m-%d").date()

    def save_case(self):
        try:
            client_id = self.client_combo.currentData()
            case_number = self.case_number_input.text().strip()
            case_type = self.case_type_input.text().strip()
            opposing_party = self.opposing_input.text().strip()
            court = self.court_input.text().strip()

            if not all([client_id, case_number, case_type, opposing_party, court]):
                QMessageBox.warning(self, "Erro", "Preencha os campos obrigatórios.")
                return

            data = dict(
                client_id=client_id,
                case_number=case_number,
                case_type=case_type,
                opposing_party=opposing_party,
                court=court,
                judge=self.judge_input.text() or None,
                legal_area=self.area_input.text() or None,
                status=self.status_combo.currentText(),
                priority=self.priority_combo.currentText(),
                filing_date=self.parse_date(self.filing_input.text().strip())
                if self.filing_input.text().strip() else None,
                deadline=self.parse_date(self.deadline_input.text().strip())
                if self.deadline_input.text().strip() else None,
                conclusion_date=self.parse_date(self.conclusion_input.text().strip())
                if self.conclusion_input.text().strip() else None,
                claim_value=self.value_input.text() or None,
                notes=self.notes_input.toPlainText() or None,
            )

            if self.case:
                CaseCRUD.update(self.db, self.case.id, **data)
            else:
                CaseCRUD.create(self.db, **data)

            QMessageBox.information(self, "Sucesso", "Processo salvo com sucesso!")
            self.accept()

        except ValueError:
            QMessageBox.warning(self, "Erro", "Datas devem estar no formato AAAA-MM-DD.")
        except Exception as e:
            QMessageBox.critical(self, "Erro", f"Erro ao salvar processo: {str(e)}")


class CaseListWidget(QWidget):
    """Case list and management widget"""

    def __init__(self, db: Session):
        super().__init__()
        self.db = db
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()

        title = QLabel("Gestão de Processos")
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)

        # Search bar
        search_layout = QHBoxLayout()
        search_label = QLabel("Pesquisar:")
        search_label.setFont(AccessibleConfig.get_font())
        self.search_input = QLineEdit()
        self.search_input.setMinimumHeight(40)
        self.search_input.setFont(AccessibleConfig.get_font())
        search_btn = QPushButton("Buscar")
        search_btn.setMinimumHeight(40)
        search_btn.setMinimumWidth(150)
        search_btn.setFont(AccessibleConfig.get_font())
        search_btn.clicked.connect(self.search_cases)

        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(search_btn)
        layout.addLayout(search_layout)

        # Cases table
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels([
            "ID", "Número", "Cliente", "Status", "Prioridade", "Prazo", ""
        ])
        self.table.setMinimumHeight(400)
        self.table.setFont(AccessibleConfig.get_font())
        
        # Style table headers
        header = self.table.horizontalHeader()
        header.setFont(AccessibleConfig.get_font(bold=True))
        header.setDefaultSectionSize(100)
        
        layout.addWidget(self.table)

        # Buttons
        button_layout = QHBoxLayout()
        new_case_btn = QPushButton("+ Novo Processo")
        new_case_btn.setMinimumHeight(50)
        new_case_btn.setFont(AccessibleConfig.get_font())
        new_case_btn.clicked.connect(self.new_case)
        button_layout.addWidget(new_case_btn)

        refresh_btn = QPushButton("Atualizar")
        refresh_btn.setMinimumHeight(50)
        refresh_btn.setFont(AccessibleConfig.get_font())
        refresh_btn.clicked.connect(self.load_cases)
        button_layout.addWidget(refresh_btn)

        layout.addLayout(button_layout)
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)

        self.load_cases()

    def load_cases(self):
        self.table.setRowCount(0)
        cases = CaseCRUD.read_all(self.db, limit=1000)

        for row, case in enumerate(cases):
            self.table.insertRow(row)

            self.table.setItem(row, 0, QTableWidgetItem(str(case.id)))
            self.table.setItem(row, 1, QTableWidgetItem(str(case.case_number)))
            self.table.setItem(row, 2, QTableWidgetItem(str(case.client.name)))
            self.table.setItem(row, 3, QTableWidgetItem(str(case.status.value)))
            self.table.setItem(row, 4, QTableWidgetItem(str(case.priority.value)))
            deadline_text = case.deadline.isoformat() if case.deadline is not None else ""
            self.table.setItem(row, 5, QTableWidgetItem(deadline_text))

            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(10, 2, 0, 2)
            action_layout.setSpacing(5)

            edit_btn = QPushButton('Editar')
            edit_btn.setFont(AccessibleConfig.get_font(0.9))
            edit_btn.setMinimumHeight(30)
            edit_btn.setMaximumHeight(35)
            edit_btn.clicked.connect(lambda _, c=case: self.edit_case(c))
            action_layout.addWidget(edit_btn)

            delete_btn = QPushButton('Excluir')
            delete_btn.setFont(AccessibleConfig.get_font(0.9))
            delete_btn.setMinimumHeight(30)
            delete_btn.setMaximumHeight(35)
            delete_btn.clicked.connect(lambda _, c=case: self.delete_case(c))
            action_layout.addWidget(delete_btn)

            self.table.setCellWidget(row, 6, action_widget)
            self.table.setRowHeight(row, 45)

    def new_case(self):
        dialog = CaseFormDialog(self, db=self.db)
        if dialog.exec():
            self.load_cases()

    def edit_case(self, case):
        dialog = CaseFormDialog(self, case=case, db=self.db)
        if dialog.exec():
            self.load_cases()

    def delete_case(self, case):
        reply = QMessageBox.question(
            self,
            "Confirmar Exclusão",
            f"Deseja excluir o processo '{case.case_number}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            CaseCRUD.delete(self.db, case.id)
            self.load_cases()

    def search_cases(self):
        query = self.search_input.text().strip()
        if not query:
            self.load_cases()
            return

        self.table.setRowCount(0)
        cases = CaseCRUD.search(self.db, query)

        for row, case in enumerate(cases):
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(str(case.id)))
            self.table.setItem(row, 1, QTableWidgetItem(str(case.case_number)))
            self.table.setItem(row, 2, QTableWidgetItem(str(case.client.name)))
            self.table.setItem(row, 3, QTableWidgetItem(str(case.status.value)))
            self.table.setItem(row, 4, QTableWidgetItem(str(case.priority.value)))
            deadline_text = case.deadline.isoformat() if case.deadline is not None else ""
            self.table.setItem(row, 5, QTableWidgetItem(deadline_text))

            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(10, 2, 0, 2)
            action_layout.setSpacing(5)

            edit_btn = QPushButton('Editar')
            edit_btn.setFont(AccessibleConfig.get_font(0.9))
            edit_btn.setMinimumHeight(30)
            edit_btn.setMaximumHeight(35)
            edit_btn.clicked.connect(lambda _, c=case: self.edit_case(c))
            action_layout.addWidget(edit_btn)

            delete_btn = QPushButton('Excluir')
            delete_btn.setFont(AccessibleConfig.get_font(0.9))
            delete_btn.setMinimumHeight(30)
            delete_btn.setMaximumHeight(35)
            delete_btn.clicked.connect(lambda _, c=case: self.delete_case(c))
            action_layout.addWidget(delete_btn)

            self.table.setCellWidget(row, 6, action_widget)
            self.table.setRowHeight(row, 45)
    
    def refresh_theme(self):
        """Refresh theme and fonts"""
        AccessibleConfig.apply_theme(self)
        
        # Update all widgets
        for i in range(self.layout().count()):
            item = self.layout().itemAt(i)
            if item.layout():
                for j in range(item.layout().count()):
                    widget = item.layout().itemAt(j).widget()
                    if widget:
                        if isinstance(widget, QLabel):
                            widget.setFont(AccessibleConfig.get_font(bold=True))
                        elif isinstance(widget, (QPushButton, QLineEdit)):
                            widget.setFont(AccessibleConfig.get_font())
            elif item.widget():
                widget = item.widget()
                if isinstance(widget, QTableWidget):
                    widget.setFont(AccessibleConfig.get_font())
        
        # Reload to refresh table fonts
        self.load_cases()


class NoticeFormDialog(QDialog):
    """Dialog for creating/editing notices"""

    def __init__(self, parent=None, notice=None, db: Optional[Session] = None):
        super().__init__(parent)
        self.notice = notice
        self.db = db or SessionLocal()
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("Cadastro de Aviso/Prazo")
        self.setMinimumSize(650, 650)

        layout = QVBoxLayout()
        title = QLabel("Cadastro de Aviso/Prazo")
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)

        form = QFormLayout()
        form.setSpacing(15)

        # Case
        case_label = QLabel("Processo:")
        case_label.setFont(AccessibleConfig.get_font())
        self.case_combo = QComboBox()
        self.case_combo.setMinimumHeight(40)
        self.case_combo.setFont(AccessibleConfig.get_font())
        self.load_cases()
        form.addRow(case_label, self.case_combo)

        # Title
        title_label = QLabel("Título:")
        title_label.setFont(AccessibleConfig.get_font())
        self.title_input = QLineEdit()
        self.title_input.setMinimumHeight(40)
        self.title_input.setFont(AccessibleConfig.get_font())
        form.addRow(title_label, self.title_input)

        # Due date
        due_label = QLabel("Prazo (AAAA-MM-DD):")
        due_label.setFont(AccessibleConfig.get_font())
        self.due_input = QLineEdit()
        self.due_input.setMinimumHeight(40)
        self.due_input.setFont(AccessibleConfig.get_font())
        form.addRow(due_label, self.due_input)

        # Description
        desc_label = QLabel("Descrição/Detalhes:")
        desc_label.setFont(AccessibleConfig.get_font())
        self.desc_input = QTextEdit()
        self.desc_input.setMinimumHeight(120)
        self.desc_input.setFont(AccessibleConfig.get_font())
        form.addRow(desc_label, self.desc_input)

        layout.addLayout(form)

        # Buttons
        button_layout = QHBoxLayout()
        save_btn = QPushButton("Salvar")
        save_btn.setMinimumHeight(50)
        save_btn.setFont(AccessibleConfig.get_font())
        save_btn.clicked.connect(self.save_notice)
        button_layout.addWidget(save_btn)

        cancel_btn = QPushButton("Cancelar")
        cancel_btn.setMinimumHeight(50)
        cancel_btn.setFont(AccessibleConfig.get_font())
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        layout.addLayout(button_layout)
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)

        if self.notice:
            self.populate_fields()

    def load_cases(self):
        self.case_combo.clear()
        cases = CaseCRUD.read_all(self.db, limit=1000)
        for case in cases:
            label = f"{case.id} - {case.case_number} - {case.client.name}"
            self.case_combo.addItem(label, case.id)

    def populate_fields(self):
        if not self.notice:
            return
        self.case_combo.setCurrentIndex(
            max(0, self.case_combo.findData(self.notice.case_id))
        )
        self.title_input.setText(self.notice.title)
        self.due_input.setText(self.notice.due_date.isoformat())
        self.desc_input.setPlainText(self.notice.description or "")

    @staticmethod
    def parse_date(value: str):
        if not value:
            return None
        return datetime.strptime(value, "%Y-%m-%d").date()

    def save_notice(self):
        try:
            case_id = self.case_combo.currentData()
            title = self.title_input.text().strip()
            due_date = self.due_input.text().strip()

            if not all([case_id, title, due_date]):
                QMessageBox.warning(self, "Erro", "Preencha os campos obrigatórios.")
                return

            data = dict(
                case_id=case_id,
                title=title,
                due_date=self.parse_date(due_date),
                description=self.desc_input.toPlainText() or None,
            )

            if self.notice:
                NoticeCRUD.update(self.db, self.notice.id, **data)
            else:
                NoticeCRUD.create(self.db, **data)

            QMessageBox.information(self, "Sucesso", "Aviso salvo com sucesso!")
            self.accept()

        except ValueError:
            QMessageBox.warning(self, "Erro", "Data deve estar no formato AAAA-MM-DD.")
        except Exception as e:
            QMessageBox.critical(self, "Erro", f"Erro ao salvar aviso: {str(e)}")


class NoticeListWidget(QWidget):
    """Notice list and management widget"""

    def __init__(self, db: Session):
        super().__init__()
        self.db = db
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        title = QLabel('Avisos e Prazos')
        title.setFont(AccessibleConfig.get_font(1.5, bold=True))
        layout.addWidget(title)

        # Filter bar with stateful buttons
        filter_layout = QHBoxLayout()
        
        self.pending_btn = QPushButton('Pendentes')
        self.pending_btn.setMinimumHeight(40)
        self.pending_btn.setFont(AccessibleConfig.get_font())
        self.pending_btn.setCheckable(True)
        self.pending_btn.setObjectName('filterButton')
        self.pending_btn.clicked.connect(self.on_filter_click)
        
        self.overdue_btn = QPushButton('Vencidos')
        self.overdue_btn.setMinimumHeight(40)
        self.overdue_btn.setFont(AccessibleConfig.get_font())
        self.overdue_btn.setCheckable(True)
        self.overdue_btn.setObjectName('filterButton')
        self.overdue_btn.clicked.connect(self.on_filter_click)
        
        self.upcoming_btn = QPushButton('Próximos 7 dias')
        self.upcoming_btn.setMinimumHeight(40)
        self.upcoming_btn.setFont(AccessibleConfig.get_font())
        self.upcoming_btn.setCheckable(True)
        self.upcoming_btn.setObjectName('filterButton')
        self.upcoming_btn.clicked.connect(self.on_filter_click)
        
        self.all_btn = QPushButton('Todos')
        self.all_btn.setMinimumHeight(40)
        self.all_btn.setFont(AccessibleConfig.get_font())
        self.all_btn.setCheckable(True)
        self.all_btn.setObjectName('filterButton')
        self.all_btn.setChecked(True)  # Default: show all
        self.all_btn.clicked.connect(self.on_filter_click)

        filter_layout.addWidget(self.pending_btn)
        filter_layout.addWidget(self.overdue_btn)
        filter_layout.addWidget(self.upcoming_btn)
        filter_layout.addWidget(self.all_btn)
        layout.addLayout(filter_layout)

        # Notices table
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels([
            'ID', 'Processo', 'Título', 'Prazo', 'Status', ''
        ])
        self.table.setMinimumHeight(400)
        self.table.setFont(AccessibleConfig.get_font())
        
        # Style table headers
        header = self.table.horizontalHeader()
        header.setFont(AccessibleConfig.get_font(bold=True))
        header.setDefaultSectionSize(100)
        
        layout.addWidget(self.table)

        # Buttons
        button_layout = QHBoxLayout()
        new_notice_btn = QPushButton("+ Novo Aviso")
        new_notice_btn.setMinimumHeight(50)
        new_notice_btn.setFont(AccessibleConfig.get_font())
        new_notice_btn.clicked.connect(self.new_notice)
        button_layout.addWidget(new_notice_btn)

        refresh_btn = QPushButton("Atualizar")
        refresh_btn.setMinimumHeight(50)
        refresh_btn.setFont(AccessibleConfig.get_font())
        refresh_btn.clicked.connect(self.load_notices)
        button_layout.addWidget(refresh_btn)

        layout.addLayout(button_layout)
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)

        self.load_notices()

    def populate_table(self, notices):
        self.table.setRowCount(0)
        for row, notice in enumerate(notices):
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(str(notice.id)))
            self.table.setItem(row, 1, QTableWidgetItem(str(notice.case.case_number)))
            self.table.setItem(row, 2, QTableWidgetItem(str(notice.title)))
            self.table.setItem(row, 3, QTableWidgetItem(notice.due_date.isoformat()))
            self.table.setItem(row, 4, QTableWidgetItem(
                "Concluído" if notice.is_completed else "Pendente"
            ))

            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(10, 2, 0, 2)
            action_layout.setSpacing(5)

            edit_btn = QPushButton('Editar')
            edit_btn.setFont(AccessibleConfig.get_font(0.9))
            edit_btn.setMinimumHeight(30)
            edit_btn.setMaximumHeight(35)
            edit_btn.clicked.connect(lambda _, n=notice: self.edit_notice(n))
            action_layout.addWidget(edit_btn)

            done_btn = QPushButton('Concluir')
            done_btn.setFont(AccessibleConfig.get_font(0.9))
            done_btn.setMinimumHeight(30)
            done_btn.setMaximumHeight(35)
            done_btn.clicked.connect(lambda _, n=notice: self.complete_notice(n))
            action_layout.addWidget(done_btn)

            delete_btn = QPushButton('Excluir')
            delete_btn.setFont(AccessibleConfig.get_font(0.9))
            delete_btn.setMinimumHeight(30)
            delete_btn.setMaximumHeight(35)
            delete_btn.clicked.connect(lambda _, n=notice: self.delete_notice(n))
            action_layout.addWidget(delete_btn)

            self.table.setCellWidget(row, 5, action_widget)
            self.table.setRowHeight(row, 45)

    def load_notices(self):
        self.pending_btn.setChecked(False)
        self.overdue_btn.setChecked(False)
        self.upcoming_btn.setChecked(False)
        self.all_btn.setChecked(True)
        self.populate_table(NoticeCRUD.read_all(self.db))

    def load_pending(self):
        self.pending_btn.setChecked(True)
        self.overdue_btn.setChecked(False)
        self.upcoming_btn.setChecked(False)
        self.all_btn.setChecked(False)
        self.populate_table(NoticeCRUD.read_pending(self.db))

    def load_overdue(self):
        self.pending_btn.setChecked(False)
        self.overdue_btn.setChecked(True)
        self.upcoming_btn.setChecked(False)
        self.all_btn.setChecked(False)
        self.populate_table(NoticeCRUD.read_overdue(self.db))

    def load_upcoming(self):
        self.pending_btn.setChecked(False)
        self.overdue_btn.setChecked(False)
        self.upcoming_btn.setChecked(True)
        self.all_btn.setChecked(False)
        self.populate_table(NoticeCRUD.read_upcoming(self.db, days=7))
    
    def on_filter_click(self):
        '''Handle filter button clicks'''
        sender = self.sender()
        if sender == self.pending_btn:
            self.load_pending()
        elif sender == self.overdue_btn:
            self.load_overdue()
        elif sender == self.upcoming_btn:
            self.load_upcoming()
        elif sender == self.all_btn:
            self.load_notices()

    def new_notice(self):
        dialog = NoticeFormDialog(self, db=self.db)
        if dialog.exec():
            self.load_notices()

    def edit_notice(self, notice):
        dialog = NoticeFormDialog(self, notice=notice, db=self.db)
        if dialog.exec():
            self.load_notices()

    def complete_notice(self, notice):
        NoticeCRUD.mark_completed(self.db, notice.id)
        self.load_notices()

    def delete_notice(self, notice):
        reply = QMessageBox.question(
            self,
            "Confirmar Exclusão",
            f"Deseja excluir o aviso '{notice.title}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            NoticeCRUD.delete(self.db, notice.id)
            self.load_notices()
    
    def refresh_theme(self):
        """Refresh theme and fonts"""
        AccessibleConfig.apply_theme(self)
        
        # Update all widgets
        for i in range(self.layout().count()):
            item = self.layout().itemAt(i)
            if item.layout():
                for j in range(item.layout().count()):
                    widget = item.layout().itemAt(j).widget()
                    if widget:
                        if isinstance(widget, QLabel):
                            widget.setFont(AccessibleConfig.get_font(bold=True))
                        elif isinstance(widget, (QPushButton, QLineEdit)):
                            widget.setFont(AccessibleConfig.get_font())
            elif item.widget():
                widget = item.widget()
                if isinstance(widget, QTableWidget):
                    widget.setFont(AccessibleConfig.get_font())
        
        # Reload to refresh table fonts
        self.load_notices()


class ClientListWindow(QMainWindow):
    """Main window with tabs for clients and cases"""

    def __init__(self):
        super().__init__()
        self.db = SessionLocal()
        init_db()
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("Sistema Judiciário - Gestão")
        self.setMinimumSize(1200, 800)

        # Central widget with vertical layout
        central_widget = QWidget()
        main_layout = QVBoxLayout(central_widget)
        
        # Control bar for themes and font size
        control_bar = QHBoxLayout()
        
        # Theme selector
        theme_label = QLabel("Tema:")
        theme_label.setFont(AccessibleConfig.get_font(bold=True))
        control_bar.addWidget(theme_label)
        
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(list(AccessibleConfig.THEMES.keys()))
        self.theme_combo.setFont(AccessibleConfig.get_font())
        self.theme_combo.setMinimumWidth(200)
        self.theme_combo.currentTextChanged.connect(self.change_theme)
        control_bar.addWidget(self.theme_combo)
        
        control_bar.addStretch()
        
        # Font size controls
        font_label = QLabel("Tamanho da Fonte:")
        font_label.setFont(AccessibleConfig.get_font(bold=True))
        control_bar.addWidget(font_label)
        
        decrease_font_btn = QPushButton("A-")
        decrease_font_btn.setFont(AccessibleConfig.get_font(1.2, bold=True))
        decrease_font_btn.setMinimumHeight(40)
        decrease_font_btn.setMinimumWidth(60)
        decrease_font_btn.clicked.connect(self.decrease_font)
        control_bar.addWidget(decrease_font_btn)
        
        reset_font_btn = QPushButton("A")
        reset_font_btn.setFont(AccessibleConfig.get_font(1.3, bold=True))
        reset_font_btn.setMinimumHeight(40)
        reset_font_btn.setMinimumWidth(60)
        reset_font_btn.clicked.connect(self.reset_font)
        control_bar.addWidget(reset_font_btn)
        
        increase_font_btn = QPushButton("A+")
        increase_font_btn.setFont(AccessibleConfig.get_font(1.4, bold=True))
        increase_font_btn.setMinimumHeight(40)
        increase_font_btn.setMinimumWidth(60)
        increase_font_btn.clicked.connect(self.increase_font)
        control_bar.addWidget(increase_font_btn)
        
        main_layout.addLayout(control_bar)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setFont(AccessibleConfig.get_font(1.1))

        self.clients_tab = ClientListWidget(self.db)
        self.cases_tab = CaseListWidget(self.db)
        self.notices_tab = NoticeListWidget(self.db)

        self.tabs.addTab(self.clients_tab, "Clientes")
        self.tabs.addTab(self.cases_tab, "Processos")
        self.tabs.addTab(self.notices_tab, "Avisos")
        
        main_layout.addWidget(self.tabs)

        self.setCentralWidget(central_widget)
        AccessibleConfig.apply_theme(self)
    
    def change_theme(self, theme_name):
        """Change the application theme"""
        AccessibleConfig.set_theme(theme_name)
        self.refresh_ui()
    
    def increase_font(self):
        """Increase font size"""
        AccessibleConfig.set_font_scale(AccessibleConfig._font_scale + 0.1)
        self.refresh_ui()
    
    def decrease_font(self):
        """Decrease font size"""
        AccessibleConfig.set_font_scale(AccessibleConfig._font_scale - 0.1)
        self.refresh_ui()
    
    def reset_font(self):
        """Reset font size to default"""
        AccessibleConfig.set_font_scale(1.0)
        self.refresh_ui()
    
    def refresh_ui(self):
        """Refresh all UI elements with new theme/font"""
        AccessibleConfig.apply_theme(self)
        
        # Update control bar elements
        main_layout = self.centralWidget().layout()
        if main_layout and main_layout.count() > 0:
            control_bar_item = main_layout.itemAt(0)
            if control_bar_item and control_bar_item.layout():
                control_bar = control_bar_item.layout()
                for i in range(control_bar.count()):
                    item = control_bar.itemAt(i)
                    if item and item.widget():
                        widget = item.widget()
                        if isinstance(widget, QLabel):
                            widget.setFont(AccessibleConfig.get_font(bold=True))
                        elif isinstance(widget, QComboBox):
                            widget.setFont(AccessibleConfig.get_font())
                        elif isinstance(widget, QPushButton):
                            # Update font size buttons
                            if widget.text() == "A-":
                                widget.setFont(AccessibleConfig.get_font(1.2, bold=True))
                            elif widget.text() == "A":
                                widget.setFont(AccessibleConfig.get_font(1.3, bold=True))
                            elif widget.text() == "A+":
                                widget.setFont(AccessibleConfig.get_font(1.4, bold=True))
        
        # Update tabs font
        self.tabs.setFont(AccessibleConfig.get_font(1.1))
        
        # Refresh each tab
        if hasattr(self.clients_tab, 'refresh_theme'):
            self.clients_tab.refresh_theme()
        if hasattr(self.cases_tab, 'refresh_theme'):
            self.cases_tab.refresh_theme()
        if hasattr(self.notices_tab, 'refresh_theme'):
            self.notices_tab.refresh_theme()


def main():
    """Main entry point"""
    app = QApplication([])
    window = ClientListWindow()
    window.show()
    app.exec()


if __name__ == "__main__":
    main()
