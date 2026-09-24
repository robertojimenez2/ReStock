"""add ondelete cascade to spec child tables

Revision ID: 0279ba4b0441
Revises: a54fe6c9ffe1
Create Date: 2026-09-23 22:39:49.060964

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0279ba4b0441'
down_revision: Union[str, Sequence[str], None] = 'a54fe6c9ffe1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # surplus_specifications
    op.drop_constraint(
        "surplus_specifications_surplus_id_fkey",
        "surplus_specifications",
        type_="foreignkey",
    )
    op.drop_constraint(
        "surplus_specifications_specification_id_fkey",
        "surplus_specifications",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "surplus_specifications_surplus_id_fkey",
        "surplus_specifications", "surpluses",
        ["surplus_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "surplus_specifications_specification_id_fkey",
        "surplus_specifications", "specifications",
        ["specification_id"], ["id"],
        ondelete="CASCADE",
    )

    # need_specifications
    op.drop_constraint(
        "need_specifications_need_id_fkey",
        "need_specifications",
        type_="foreignkey",
    )
    op.drop_constraint(
        "need_specifications_specification_id_fkey",
        "need_specifications",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "need_specifications_need_id_fkey",
        "need_specifications", "needs",
        ["need_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "need_specifications_specification_id_fkey",
        "need_specifications", "specifications",
        ["specification_id"], ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "surplus_specifications_surplus_id_fkey",
        "surplus_specifications",
        type_="foreignkey",
    )
    op.drop_constraint(
        "surplus_specifications_specification_id_fkey",
        "surplus_specifications",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "surplus_specifications_surplus_id_fkey",
        "surplus_specifications", "surpluses",
        ["surplus_id"], ["id"],
    )
    op.create_foreign_key(
        "surplus_specifications_specification_id_fkey",
        "surplus_specifications", "specifications",
        ["specification_id"], ["id"],
    )

    op.drop_constraint(
        "need_specifications_need_id_fkey",
        "need_specifications",
        type_="foreignkey",
    )
    op.drop_constraint(
        "need_specifications_specification_id_fkey",
        "need_specifications",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "need_specifications_need_id_fkey",
        "need_specifications", "needs",
        ["need_id"], ["id"],
    )
    op.create_foreign_key(
        "need_specifications_specification_id_fkey",
        "need_specifications", "specifications",
        ["specification_id"], ["id"],
    )