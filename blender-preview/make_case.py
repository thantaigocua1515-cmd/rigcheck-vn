# RigCheck VN — Blender preview: 1 mau case PC gaming trang, build mac dinh
# Ryzen 5 7500F + RTX 4070 + B650 ATX + RAM DDR5 x2 + AIO 360 noc.
# Don vi scene: 1 unit = 100mm. Case ATX ~ 4.5 (sau X) x 2.1 (rong Y) x 4.5 (cao Z).
# Mat truoc o -X, mat kinh ben hong o -Y, mainboard gan tuong +Y.
# Chay: blender -b --python make_case.py
#
# TO CHUC SCENE (cap nhat): moi nhom linh kien co CA collection LAN Empty parent
# cung ten de glTF xuat thanh node truy van duoc:
#   CASE, BOARD, GPU_STD, GPU_LONG, COOLER_AIO (+ subgroup RADIATOR),
#   COOLER_AIR, RAM (+ 4 Empty con RAM_1..RAM_4), PSU.
# Bien the phu (GPU_LONG, COOLER_AIR, RAM_3/RAM_4) chi hide_render khi chup anh
# kiem tra — van xuat day du trong GLB.
import bpy, math, os
from mathutils import Vector, Matrix

OUT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(OUT), 'assets')

# ---------- don sach scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- materials ----------
def mat(name, color, metallic=0.0, rough=0.5, emission=None, estr=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if emission is not None:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1.0)
        bsdf.inputs['Emission Strength'].default_value = estr
    return m

WHITE   = mat('WhitePaint',  (0.92, 0.93, 0.95), metallic=0.25, rough=0.35)
WHITE2  = mat('WhiteMatte',  (0.85, 0.86, 0.88), metallic=0.05, rough=0.55)
DARK    = mat('DarkPlastic', (0.03, 0.03, 0.04), metallic=0.10, rough=0.55)
PCB     = mat('PCB',         (0.02, 0.05, 0.05), metallic=0.20, rough=0.45)
SILVER  = mat('Silver',      (0.65, 0.67, 0.70), metallic=0.90, rough=0.30)
GUN     = mat('Gunmetal',    (0.10, 0.11, 0.13), metallic=0.80, rough=0.38)
RUBBER  = mat('Rubber',      (0.015, 0.015, 0.02), metallic=0.0, rough=0.85)
MESH    = mat('MeshDark',    (0.04, 0.04, 0.05), metallic=0.40, rough=0.60)
TXT     = mat('TextDark',    (0.08, 0.09, 0.11), metallic=0.30, rough=0.45)
COPPER  = mat('Copper',      (0.72, 0.38, 0.20), metallic=0.90, rough=0.32)
LED_CYAN   = mat('LEDcyan',   (0.0, 0.05, 0.06), emission=(0.15, 0.85, 1.0), estr=6.5)
LED_PURPLE = mat('LEDpurple', (0.05, 0.0, 0.06), emission=(0.62, 0.30, 1.0), estr=6.5)
LED_WHITE  = mat('LEDwhite',  (0.05, 0.05, 0.05), emission=(0.9, 0.95, 1.0), estr=3.5)
LED_SOFT   = mat('LEDsoft',   (0.03, 0.04, 0.05), emission=(0.45, 0.75, 1.0), estr=2.2)

def glass_mat(name, tint=(0.9, 0.95, 1.0), reflect_scale=0.30):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    fres = nt.nodes.new('ShaderNodeFresnel')
    fres.inputs['IOR'].default_value = 1.45
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = reflect_scale
    trans = nt.nodes.new('ShaderNodeBsdfTransparent')
    gloss = nt.nodes.new('ShaderNodeBsdfGlossy')
    gloss.inputs['Color'].default_value = (*tint, 1.0)
    gloss.inputs['Roughness'].default_value = 0.12
    nt.links.new(fres.outputs['Fac'], mul.inputs[0])
    nt.links.new(mul.outputs[0], mix.inputs['Fac'])
    nt.links.new(trans.outputs[0], mix.inputs[1])
    nt.links.new(gloss.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m

GLASS = glass_mat('GlassSide', reflect_scale=0.30)
GLASS_FRONT = glass_mat('GlassFront', tint=(0.35, 0.38, 0.42), reflect_scale=0.45)

# ---------- helpers ----------
def finish(obj, material=None, bevel=0.0):
    if material:
        obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new('bev', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    return obj

def add_box(name, loc, dims, material=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, material, bevel)

def add_cyl(name, loc, radius, depth, material=None, rot=(0, 0, 0), verts=28, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=verts,
                                        location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return finish(o, material, bevel)

def add_torus(name, loc, major, minor, material=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=36, minor_segments=10,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return finish(o, material)

def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

# ---------- to chuc nhom: collection + Empty parent cung ten ----------
GROUPS = {}   # ten nhom -> {'empty': obj, 'coll': collection}
MEMBERS = {}  # ten nhom -> [object con truc tiep]

def _move_to_collection(obj, coll):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    try:
        coll.objects.link(obj)
    except RuntimeError:
        pass

def _parent_keep_world(obj, empty):
    # parent vao Empty nhung giu nguyen vi tri world cua object con:
    # matrix_parent_inverse = inverse(matrix_world cua Empty), basis = world cu
    bpy.context.view_layer.update()
    mw = obj.matrix_world.copy()
    obj.parent = empty
    obj.matrix_parent_inverse = empty.matrix_world.inverted()
    obj.matrix_basis = mw
    bpy.context.view_layer.update()

def define_group(name, loc=(0, 0, 0), parent_group=None):
    parent_coll = GROUPS[parent_group]['coll'] if parent_group else None
    parent_empty = GROUPS[parent_group]['empty'] if parent_group else None
    coll = bpy.data.collections.new(name)
    (parent_coll or scene.collection).children.link(coll)
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = 'PLAIN_AXES'
    empty.empty_display_size = 0.25
    scene.collection.objects.link(empty)
    empty.location = loc
    bpy.context.view_layer.update()
    if parent_empty is not None:
        _parent_keep_world(empty, parent_empty)
    _move_to_collection(empty, coll)
    GROUPS[name] = {'empty': empty, 'coll': coll}
    MEMBERS[name] = []
    return GROUPS[name]

def assign(obj, group):
    """Dua object vao collection + parent Empty cua nhom, giu nguyen world transform."""
    if obj is None:
        return obj
    g = GROUPS[group]
    _move_to_collection(obj, g['coll'])
    _parent_keep_world(obj, g['empty'])
    MEMBERS[group].append(obj)
    return obj

def assign_many(objs, group):
    for o in objs:
        assign(o, group)
    return objs

# Empty cap 1 o goc (0,0,0), tru cac nhom dat tai tam de JS scale quanh tam.
define_group('CASE')
define_group('BOARD',     (0.93, 0.75, 2.10))
define_group('GPU_STD',   (0.68, 0.22, 1.95))
define_group('GPU_LONG',  (0.305, 0.22, 1.95))
define_group('COOLER_AIO')
define_group('RADIATOR',  (0.30, 0.05, 4.13), parent_group='COOLER_AIO')
define_group('COOLER_AIR')
define_group('RAM')
define_group('RAM_1', (0.56, 0.55, 2.98), parent_group='RAM')
define_group('RAM_2', (0.40, 0.55, 2.98), parent_group='RAM')
define_group('RAM_3', (0.24, 0.55, 2.98), parent_group='RAM')
define_group('RAM_4', (0.08, 0.55, 2.98), parent_group='RAM')
define_group('PSU')

# ---------- fan (dung theo truc Z local roi xoay bang basis matrix) ----------
def make_fan(prefix, center, axis, R, led=None, frame=True, blade_mat=None):
    n = Vector(axis).normalized()
    helper = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))
    u = n.cross(helper).normalized()
    v = n.cross(u).normalized()
    M = Matrix(((u.x, v.x, n.x, 0), (u.y, v.y, n.y, 0), (u.z, v.z, n.z, 0), (0, 0, 0, 1)))
    C = Matrix.Translation(Vector(center))
    created = []

    def place(o, l_loc, l_rot=None):
        W = C @ M @ Matrix.Translation(Vector(l_loc)) @ (l_rot or Matrix.Identity(4))
        o.matrix_world = W
        created.append(o)
        return o

    bm = blade_mat or DARK
    if frame:
        rail = (2.15 * R, 0.16 * R, 0.20)
        for s in (-1, 1):
            place(add_box(prefix + '_frT', (0, 0, 0), (rail[0], rail[1], rail[2]), WHITE2, 0.02),
                  (0, s * R * 0.99, 0))
            place(add_box(prefix + '_frS', (0, 0, 0), (rail[1], rail[0] * 0.88, rail[2]), WHITE2, 0.02),
                  (s * R * 0.99, 0, 0))
    place(add_torus(prefix + '_ring', (0, 0, 0), R * 0.86, 0.055 * R + 0.02, WHITE2), (0, 0, 0))
    if led is not None:
        place(add_torus(prefix + '_led', (0, 0, 0), R * 1.0, 0.035, led), (0, 0, 0.02))
    place(add_cyl(prefix + '_hub', (0, 0, 0), R * 0.30, 0.16, bm, verts=24), (0, 0, 0))
    for i in range(7):
        ang = i * 2 * math.pi / 7.0
        Rz = Matrix.Rotation(ang, 4, 'Z')
        pitch = Matrix.Rotation(0.62, 4, 'X')
        loc = Rz @ Vector((R * 0.55, 0, 0))
        b = add_box(prefix + '_b%d' % i, (0, 0, 0), (R * 0.62, R * 0.36, 0.045), bm, 0.015)
        place(b, loc, Rz @ pitch)
    bpy.context.view_layer.update()
    return created

def add_curve(name, pts, radius, material):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 4
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    for p, co in zip(sp.bezier_points, pts):
        p.co = co
        p.handle_left_type = 'AUTO'
        p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    if material:
        cu.materials.append(material)
    return o

# ================= VO CASE (nhom CASE) =================
# tam day / noc / hong phai / sau
assign(add_box('BottomPanel', (0, 0, 0.05), (4.5, 2.1, 0.10), WHITE, 0.04), 'CASE')
assign(add_box('TopPanel',    (0, 0, 4.45), (4.5, 2.1, 0.10), WHITE, 0.04), 'CASE')
assign(add_box('RightPanel',  (0, 1.03, 2.25), (4.5, 0.10, 4.5), WHITE, 0.04), 'CASE')
assign(add_box('BackPanel',   (2.21, 0, 2.25), (0.10, 2.1, 4.5), WHITE, 0.04), 'CASE')
assign(add_box('TopMesh',     (0, 0, 4.52), (3.7, 1.3, 0.05), MESH, 0.02), 'CASE')
# chan case
for sx in (-1.9, 1.9):
    for sy in (-0.85, 0.85):
        assign(add_cyl('Foot', (sx, sy, -0.05), 0.10, 0.12, DARK), 'CASE')
# mat truoc: khung trang + tam luoi/kinh toi o giua
assign(add_box('FrontRailL', (-2.21, -0.97, 2.25), (0.10, 0.28, 4.5), WHITE, 0.04), 'CASE')
assign(add_box('FrontRailR', (-2.21,  0.97, 2.25), (0.10, 0.28, 4.5), WHITE, 0.04), 'CASE')
assign(add_box('FrontRailT', (-2.21, 0, 4.32), (0.10, 1.7, 0.30), WHITE, 0.04), 'CASE')
assign(add_box('FrontRailB', (-2.21, 0, 0.18), (0.10, 1.7, 0.30), WHITE, 0.04), 'CASE')
assign(add_box('FrontMesh',  (-2.20, 0, 2.25), (0.05, 1.68, 4.0), GLASS_FRONT, 0.01), 'CASE')
# mat kinh hong trai + khung vien trang
assign(add_box('GlassPanel', (0, -1.05, 2.25), (4.34, 0.045, 4.34), GLASS, 0.01), 'CASE')
assign(add_box('GlassFrT', (0, -1.06, 4.44), (4.5, 0.07, 0.14), WHITE, 0.02), 'CASE')
assign(add_box('GlassFrB', (0, -1.06, 0.06), (4.5, 0.07, 0.14), WHITE, 0.02), 'CASE')
assign(add_box('GlassFrF', (-2.19, -1.06, 2.25), (0.14, 0.07, 4.5), WHITE, 0.02), 'CASE')
assign(add_box('GlassFrK', (2.19, -1.06, 2.25), (0.14, 0.07, 4.5), WHITE, 0.02), 'CASE')

# ================= LINH KIEN TRONG =================
# --- Mainboard ATX (tam dung, mat linh kien huong -Y) — nhom BOARD ---
assign(add_box('Motherboard', (0.93, 0.80, 2.10), (2.44, 0.07, 3.10), PCB, 0.02), 'BOARD')
assign(add_box('VRMheatsink1', (1.82, 0.70, 3.02), (0.34, 0.14, 0.95), SILVER, 0.02), 'BOARD')
assign(add_box('VRMheatsink2', (1.18, 0.70, 3.52), (1.15, 0.14, 0.28), SILVER, 0.02), 'BOARD')
assign(add_box('ChipsetHS', (1.60, 0.71, 1.12), (0.55, 0.12, 0.55), GUN, 0.03), 'BOARD')
assign(add_box('M2heatsink', (0.72, 0.72, 2.48), (0.90, 0.06, 0.24), SILVER, 0.01), 'BOARD')
assign(add_box('PCIeSlot1', (0.90, 0.72, 1.98), (2.0, 0.06, 0.10), DARK, 0.01), 'BOARD')
assign(add_box('PCIeSlot2', (0.90, 0.72, 1.55), (2.0, 0.06, 0.10), DARK, 0.01), 'BOARD')
assign(add_box('IOShield', (2.10, 0.78, 3.30), (0.10, 0.5, 0.55), SILVER, 0.01), 'BOARD')

# --- CPU block AIO + vong LED — nhom COOLER_AIO ---
assign(add_cyl('CPUblock', (1.15, 0.58, 3.00), 0.36, 0.26, GUN, rot=(math.radians(90), 0, 0), verts=32), 'COOLER_AIO')
assign(add_torus('CPUring', (1.15, 0.44, 3.00), 0.27, 0.035, LED_CYAN, rot=(math.radians(90), 0, 0)), 'COOLER_AIO')
assign(add_cyl('CPUcap', (1.15, 0.44, 3.00), 0.20, 0.05, DARK, rot=(math.radians(90), 0, 0), verts=32), 'COOLER_AIO')

# --- RAM 4 thanh + dai RGB tren dinh — nhom RAM, moi thanh trong Empty RAM_i ---
# LUU Y: Empty con da giu ten chinh xac RAM_1..RAM_4 (node GLB cho JS), nen thanh
# RAM dat ten RAM_i_stick de khong trung namespace object cua Blender.
for idx, rx in enumerate((0.56, 0.40, 0.24, 0.08), start=1):
    gname = 'RAM_%d' % idx
    assign(add_box('RAM_%d_stick' % idx, (rx, 0.55, 2.98), (0.10, 0.38, 1.32), DARK, 0.015), gname)
    assign(add_box('RAM_%d_rgb' % idx, (rx, 0.55, 3.66), (0.11, 0.39, 0.07),
                   LED_CYAN if idx % 2 == 1 else LED_PURPLE, 0.01), gname)

# --- GPU RTX 4070 (dai 245mm) — nhom GPU_STD ---
assign(add_box('GPUbody', (0.68, 0.22, 1.95), (2.45, 1.02, 0.52), GUN, 0.05), 'GPU_STD')
assign(add_box('GPUbackplate', (0.68, 0.22, 2.24), (2.40, 0.95, 0.06), DARK, 0.02), 'GPU_STD')
assign(add_box('GPUledStrip', (0.68, -0.30, 2.10), (1.90, 0.045, 0.10), LED_WHITE, 0.01), 'GPU_STD')
assign(add_box('GPUbracket', (1.95, 0.45, 1.95), (0.08, 0.55, 0.52), SILVER, 0.01), 'GPU_STD')
assign_many(make_fan('GPUfan1', (-0.15, 0.22, 1.66), (0, 0, -1), 0.40, led=None, frame=False), 'GPU_STD')
assign_many(make_fan('GPUfan2', (0.75, 0.22, 1.66), (0, 0, -1), 0.40, led=None, frame=False), 'GPU_STD')
assign_many(make_fan('GPUfan3', (1.55, 0.22, 1.66), (0, 0, -1), 0.34, led=None, frame=False), 'GPU_STD')

# --- GPU dai 320mm — nhom GPU_LONG (bien the, an khi render mac dinh) ---
assign(add_box('GPUlong_body', (0.305, 0.22, 1.95), (3.20, 1.02, 0.52), GUN, 0.05), 'GPU_LONG')
assign(add_box('GPUlong_backplate', (0.305, 0.22, 2.24), (3.15, 0.95, 0.06), DARK, 0.02), 'GPU_LONG')
assign(add_box('GPUlong_ledStrip', (0.305, -0.30, 2.10), (2.90, 0.045, 0.10), LED_WHITE, 0.01), 'GPU_LONG')
assign(add_box('GPUlong_bracket', (1.95, 0.45, 1.95), (0.08, 0.55, 0.52), SILVER, 0.01), 'GPU_LONG')
assign_many(make_fan('GPUlong_fan1', (-0.85, 0.22, 1.66), (0, 0, -1), 0.42, led=None, frame=False), 'GPU_LONG')
assign_many(make_fan('GPUlong_fan2', (0.25, 0.22, 1.66), (0, 0, -1), 0.42, led=None, frame=False), 'GPU_LONG')
assign_many(make_fan('GPUlong_fan3', (1.35, 0.22, 1.66), (0, 0, -1), 0.42, led=None, frame=False), 'GPU_LONG')

# --- Tan thap doi — nhom COOLER_AIR (bien the, an khi render mac dinh) ---
assign(add_box('AirBase', (1.15, 0.72, 3.00), (0.55, 0.10, 0.55), GUN, 0.02), 'COOLER_AIR')
for t, tx in enumerate((0.82, 1.48), start=1):
    assign(add_box('AirTower%d' % t, (tx, 0.36, 3.00), (0.45, 0.80, 1.50), SILVER, 0.03), 'COOLER_AIR')
    # ranh fin: cac tam toi mong xep chong ngang tren mat truoc thap
    for f in range(5):
        assign(add_box('AirFin%d_%d' % (t, f), (tx, 0.36, 2.45 + f * 0.28),
                       (0.46, 0.82, 0.03), MESH, 0.005), 'COOLER_AIR')
    assign(add_box('AirTopCap%d' % t, (tx, 0.36, 3.78), (0.49, 0.84, 0.07), GUN, 0.02), 'COOLER_AIR')
# ong dong: tru thang dung sat mat truoc moi thap (don gian hoa heatpipe)
for p, px in enumerate((0.70, 0.94, 1.36, 1.60), start=1):
    assign(add_cyl('AirPipe%d' % p, (px, -0.05, 3.00), 0.035, 1.50, COPPER, verts=16), 'COOLER_AIR')
assign_many(make_fan('AirFanMid', (1.15, 0.36, 3.00), (1, 0, 0), 0.55, led=LED_SOFT), 'COOLER_AIR')
assign_many(make_fan('AirFanFront', (0.45, 0.36, 3.00), (1, 0, 0), 0.55, led=LED_SOFT), 'COOLER_AIR')

# --- Nap che nguon (PSU shroud) + chu RIGCHECK — nhom CASE ---
assign(add_box('PSUShroud', (0.05, 0.02, 0.56), (4.15, 1.82, 0.96), WHITE2, 0.03), 'CASE')
bpy.ops.object.text_add(location=(-0.15, -0.90, 0.56), rotation=(math.radians(90), 0, 0))
txt = bpy.context.active_object
txt.name = 'ShroudText'
txt.data.body = 'RIGCHECK'
txt.data.size = 0.34
txt.data.extrude = 0.02
txt.data.align_x = 'CENTER'
txt.data.align_y = 'CENTER'
txt.data.materials.append(TXT)
assign(txt, 'CASE')

# --- PSU that nam trong khoang sau shroud — nhom PSU ---
# Tam dat 1.35 (thay vi 1.55) de khoi loi qua tam sau/shroud; mat quat huong +X.
assign(add_box('PSUbody', (1.35, 0, 0.55), (1.50, 1.70, 0.85), DARK, 0.03), 'PSU')
assign(add_torus('PSUfanRing', (2.11, 0, 0.55), 0.30, 0.035, GUN, rot=(0, math.radians(90), 0)), 'PSU')
assign(add_cyl('PSUfanHub', (2.11, 0, 0.55), 0.11, 0.05, GUN, rot=(0, math.radians(90), 0), verts=24), 'PSU')
assign(add_box('PSUgrilleV', (2.12, 0, 0.55), (0.03, 0.62, 0.05), GUN, 0.005), 'PSU')
assign(add_box('PSUgrilleH', (2.12, 0, 0.55), (0.03, 0.05, 0.62), GUN, 0.005), 'PSU')
assign(add_box('PSUlabel', (2.105, -0.45, 0.78), (0.02, 0.50, 0.22), WHITE2, 0.005), 'PSU')

# --- Radiator AIO 360 tren noc + 3 quat — subgroup RADIATOR; ong nuoc — COOLER_AIO ---
assign(add_box('Radiator', (0.30, 0.05, 4.22), (3.70, 1.15, 0.20), DARK, 0.03), 'RADIATOR')
for i, fx in enumerate((-0.95, 0.30, 1.55)):
    assign_many(make_fan('TopFan%d' % i, (fx, 0.05, 4.05), (0, 0, -1), 0.50, led=LED_SOFT), 'RADIATOR')
assign(add_curve('Tube1', [(1.15, 0.50, 3.30), (1.45, 0.38, 3.80), (1.55, 0.22, 4.08)], 0.055, RUBBER), 'COOLER_AIO')
assign(add_curve('Tube2', [(0.95, 0.50, 3.28), (1.22, 0.38, 3.78), (1.30, 0.22, 4.08)], 0.055, RUBBER), 'COOLER_AIO')

# --- Quat truoc x3 (LED) + quat sau x1 — nhom CASE ---
assign_many(make_fan('FrontFan1', (-2.02, 0, 1.18), (-1, 0, 0), 0.52, led=LED_CYAN), 'CASE')
assign_many(make_fan('FrontFan2', (-2.02, 0, 2.32), (-1, 0, 0), 0.52, led=LED_PURPLE), 'CASE')
assign_many(make_fan('FrontFan3', (-2.02, 0, 3.46), (-1, 0, 0), 0.52, led=LED_CYAN), 'CASE')
assign_many(make_fan('RearFan', (2.02, 0, 2.95), (1, 0, 0), 0.55, led=LED_SOFT), 'CASE')

# ================= SAN + ANH SANG + CAMERA =================
add_box('Ground', (0, 0, -0.16), (40, 40, 0.04), mat('GroundMat', (0.76, 0.77, 0.80), rough=0.95))

world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.90, 0.91, 0.94, 1.0)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.35

def add_area(name, loc, energy, size, target=(0, 0, 2.1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.shape = 'DISK'
    ld.size = size
    o = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    return o

add_area('KeyLight',  (-7, -7, 9), 750, 6.0)
add_area('FillLight', (7, -4, 4), 260, 5.0)
add_area('RimLight',  (7, 6, 8), 430, 4.0)

# den trong khoang may (mo phong LED noi that) de linh kien khong bi toi
pl = bpy.data.lights.new('InnerLight', 'POINT')
pl.energy = 14
pl.color = (0.85, 0.93, 1.0)
plo = bpy.data.objects.new('InnerLight', pl)
scene.collection.objects.link(plo)
plo.location = (-0.7, -0.35, 3.55)

cam_data = bpy.data.cameras.new('Cam')
cam_data.lens = 46
cam = bpy.data.objects.new('Cam', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# ---------- render settings ----------
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.device = 'CPU'
try:
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception:
    pass
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 1.05

# ---------- an bien the phu khoi anh render (CHI hide_render) ----------
# Anh kiem tra van la build mac dinh: AIO + GPU_STD + 2 thanh RAM (RAM_1/RAM_2).
# Khong dung hide_set/hide_viewport de buoc export GLB (use_visible) van xuat du.
for grp in ('GPU_LONG', 'COOLER_AIR', 'RAM_3', 'RAM_4'):
    for o in MEMBERS.get(grp, []):
        o.hide_render = True

# ---------- luu blend ----------
blend_path = os.path.join(OUT, 'case.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# ---------- render anh kiem tra (KHONG ghi de preview-1/2 cu) ----------
def shot(path, loc, target, lens):
    cam.location = loc
    cam_data.lens = lens
    look_at(cam, target)
    bpy.context.view_layer.update()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

scene.render.resolution_x = 800
scene.render.resolution_y = 600
shot(os.path.join(OUT, 'render-check.png'), (0.4, -10.8, 2.8), (0.3, 0, 2.1), 50)

# ---------- export GLB vao assets/ (an san, bo light/camera) ----------
ground = bpy.data.objects.get('Ground')
if ground:
    ground.hide_set(True)
for o in bpy.data.objects:
    if o.type in ('LIGHT', 'CAMERA'):
        o.hide_set(True)
bpy.context.view_layer.update()
os.makedirs(ASSETS, exist_ok=True)
glb_path = os.path.join(ASSETS, 'case.glb')
try:
    bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB',
                              use_visible=True, export_apply=True,
                              export_cameras=False, export_lights=False)
except TypeError:
    bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB',
                              use_visible=True, export_apply=True)
for o in bpy.data.objects:
    o.hide_set(False)
if ground:
    ground.hide_set(False)

# ---------- bao cao ----------
n_obj = len(bpy.data.objects)
n_vert = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH')
glb_mb = os.path.getsize(glb_path) / (1024 * 1024) if os.path.exists(glb_path) else -1
print('=== RIGCHECK REPORT ===')
print('objects:', n_obj)
print('vertices:', n_vert)
print('glb_mb: %.2f' % glb_mb)
print('glb_path:', glb_path)
print('groups:', {k: len(v) for k, v in sorted(MEMBERS.items())})
print('files:', sorted(os.listdir(OUT)))
